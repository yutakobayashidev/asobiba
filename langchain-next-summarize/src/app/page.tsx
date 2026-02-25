import Meeting from "./meeting";

export const revalidate = 3600;

async function getMeeting() {
  const response = await fetch(
    "https://kokkai.ndl.go.jp/api/meeting?from=2023-05-01&recordPacking=json"
  );

  const data = await response.json();

  const speeches: SpeechItem[] = data.meetingRecord[0].speechRecord;

  type SpeechItem = {
    speech: string;
    [key: string]: any;
  };

  const combinedSpeeches = speeches
    .slice(1)
    .map((item) => item.speech)
    .join("\n");

  return combinedSpeeches;
}

export default async function Page() {
  const meeting = await getMeeting();

  return <Meeting text={meeting} />;
}
