import { revalidatePath } from "next/cache";

export default async function Page() {
  const res = await (
    await fetch(`http://worldtimeapi.org/api/timezone/Asia/Tokyo`)
  ).json();

  async function action() {
    "use server";

    revalidatePath("/dadada");
  }

  return (
    <div>
      <h1>Page</h1>
      <div>
        <form action={action}>
          <button
            type="submit"
            className="p-2 border-gray-400 bg-white border rounded"
          >
            refresh
          </button>
        </form>
        {JSON.stringify(res)}
      </div>
    </div>
  );
}
