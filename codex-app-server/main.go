package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync/atomic"
)

var idSeq atomic.Int64

type rawEvt = map[string]json.RawMessage

func main() {
	cwd, _ := os.Getwd()

	cmd := exec.Command("codex", "app-server")
	in, err := cmd.StdinPipe()
	if err != nil {
		fatal("stdin pipe: %v", err)
	}
	out, err := cmd.StdoutPipe()
	if err != nil {
		fatal("stdout pipe: %v", err)
	}
	if err := cmd.Start(); err != nil {
		fatal("start codex app-server: %v", err)
	}
	defer func() { in.Close(); cmd.Wait() }()

	send := func(v interface{}) {
		data, _ := json.Marshal(v)
		in.Write(append(data, '\n'))
	}

	// Server event stream
	ch := make(chan rawEvt, 256)
	go func() {
		sc := bufio.NewScanner(out)
		sc.Buffer(make([]byte, 0, 2<<20), 2<<20)
		for sc.Scan() {
			var m rawEvt
			if json.Unmarshal([]byte(sc.Text()), &m) == nil {
				ch <- m
			}
		}
		close(ch)
	}()

	// waitResp drains events until a response with matching id arrives
	waitResp := func(id int64) json.RawMessage {
		for evt := range ch {
			if raw, ok := evt["id"]; ok && jint(raw) == id {
				if errRaw, ok := evt["error"]; ok {
					var e struct{ Message string `json:"message"` }
					json.Unmarshal(errRaw, &e)
					fatal("server error: %s", e.Message)
				}
				return evt["result"]
			}
		}
		return nil
	}

	// ── Setup ──

	// 1. Initialize
	initID := nextID()
	send(rpc("initialize", initID, map[string]interface{}{
		"clientInfo": map[string]string{
			"name": "codex_go_playground", "title": "Codex Go Playground", "version": "0.1.0",
		},
	}))
	send(map[string]interface{}{"method": "initialized", "params": map[string]interface{}{}})
	waitResp(initID)
	fmt.Println("initialized")

	// 2. Model list
	mlID := nextID()
	send(rpc("model/list", mlID, map[string]interface{}{"limit": 20}))
	mlResult := waitResp(mlID)

	var models struct {
		Data []struct {
			ID        string `json:"id"`
			Name      string `json:"displayName"`
			IsDefault bool   `json:"isDefault"`
		} `json:"data"`
	}
	json.Unmarshal(mlResult, &models)

	model := ""
	for _, m := range models.Data {
		mark := "  "
		if m.IsDefault {
			mark = "* "
			model = m.ID
		}
		fmt.Printf("%s%s (%s)\n", mark, m.ID, m.Name)
	}
	if model == "" && len(models.Data) > 0 {
		model = models.Data[0].ID
	}
	fmt.Printf("\nusing: %s\n", model)

	// 3. Start thread (workspaceWrite sandbox, command execution enabled)
	tsID := nextID()
	send(rpc("thread/start", tsID, map[string]interface{}{
		"model":          model,
		"cwd":            cwd,
		"approvalPolicy": "never",
		"sandbox":        "workspace-write",
	}))
	tsResult := waitResp(tsID)

	var thread struct {
		Thread struct {
			ID string `json:"id"`
		} `json:"thread"`
	}
	json.Unmarshal(tsResult, &thread)
	threadID := thread.Thread.ID
	fmt.Printf("thread: %s\n", threadID)

	// ── Interactive Loop ──

	userInput := make(chan string)
	go func() {
		sc := bufio.NewScanner(os.Stdin)
		for sc.Scan() {
			userInput <- sc.Text()
		}
		close(userInput)
	}()

	for {
		fmt.Print("\nyou> ")
		text, ok := <-userInput
		if !ok {
			break
		}
		text = strings.TrimSpace(text)
		if text == "" {
			continue
		}
		if text == "/quit" {
			break
		}

		turnID := nextID()
		send(rpc("turn/start", turnID, map[string]interface{}{
			"threadId": threadID,
			"input":    []map[string]string{{"type": "text", "text": text}},
		}))

		processTurn(ch, send)
	}
}

func processTurn(ch <-chan rawEvt, send func(interface{})) {
	agentPrinted := false

	for evt := range ch {
		method := jstr(evt["method"])

		switch {
		// ── Agent message (streaming) ──
		case method == "item/agentMessage/delta":
			var p struct{ Delta string `json:"delta"` }
			json.Unmarshal(evt["params"], &p)
			if !agentPrinted {
				fmt.Print("\nagent> ")
				agentPrinted = true
			}
			fmt.Print(p.Delta)

		// ── Reasoning (streaming) ──
		case method == "item/reasoning/summaryTextDelta":
			var p struct{ Delta string `json:"delta"` }
			json.Unmarshal(evt["params"], &p)
			fmt.Printf("\033[2m%s\033[0m", p.Delta) // dim

		// ── Item lifecycle ──
		case method == "item/started":
			var p struct {
				Item struct {
					Type    string `json:"type"`
					Command string `json:"command"`
					Cwd     string `json:"cwd"`
					Changes []struct {
						Path string `json:"path"`
						Kind string `json:"kind"`
					} `json:"changes"`
				} `json:"item"`
			}
			json.Unmarshal(evt["params"], &p)
			switch p.Item.Type {
			case "commandExecution":
				fmt.Printf("\n  \033[33m$ %s\033[0m\n", p.Item.Command)
			case "fileChange":
				for _, c := range p.Item.Changes {
					fmt.Printf("\n  \033[36m[%s] %s\033[0m\n", c.Kind, c.Path)
				}
			}

		// ── Command output (streaming) ──
		case method == "item/commandExecution/outputDelta":
			var p struct{ Delta string `json:"delta"` }
			json.Unmarshal(evt["params"], &p)
			fmt.Print(p.Delta)

		// ── File change diff ──
		case method == "item/fileChange/outputDelta":
			var p struct{ Delta string `json:"delta"` }
			json.Unmarshal(evt["params"], &p)
			fmt.Print(p.Delta)

		// ── Approval requests (auto-approve fallback) ──
		case method == "item/commandExecution/requestApproval":
			if idRaw, ok := evt["id"]; ok {
				var p struct {
					Command string `json:"command"`
				}
				json.Unmarshal(evt["params"], &p)
				fmt.Printf("\n  \033[33m[auto-approve] %s\033[0m\n", p.Command)
				send(map[string]interface{}{"id": jint(idRaw), "result": "accept"})
			}

		case method == "item/fileChange/requestApproval":
			if idRaw, ok := evt["id"]; ok {
				fmt.Printf("\n  \033[36m[auto-approve] file change\033[0m\n")
				send(map[string]interface{}{"id": jint(idRaw), "result": "accept"})
			}

		// ── Errors ──
		case method == "error":
			var p struct {
				Error struct{ Message string `json:"message"` } `json:"error"`
			}
			json.Unmarshal(evt["params"], &p)
			fmt.Printf("\n\033[31m[error] %s\033[0m\n", p.Error.Message)

		// ── Turn completed ──
		case method == "turn/completed":
			var p struct {
				Turn struct {
					Status string `json:"status"`
					Error  *struct {
						Message string `json:"message"`
					} `json:"error"`
				} `json:"turn"`
			}
			json.Unmarshal(evt["params"], &p)
			if p.Turn.Error != nil {
				fmt.Printf("\n\033[31m[%s] %s\033[0m\n", p.Turn.Status, p.Turn.Error.Message)
			}
			if agentPrinted {
				fmt.Println()
			}
			return
		}
	}
}

// ── Helpers ──

func nextID() int64    { return idSeq.Add(1) }
func rpc(method string, id int64, params interface{}) map[string]interface{} {
	return map[string]interface{}{"method": method, "id": id, "params": params}
}

func jstr(r json.RawMessage) string {
	var s string
	json.Unmarshal(r, &s)
	return s
}

func jint(r json.RawMessage) int64 {
	var n int64
	json.Unmarshal(r, &n)
	return n
}

func fatal(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
