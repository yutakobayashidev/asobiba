
export const revalidate = 0;

export default async function Bar() {

  const revalidate10 = await (await fetch(`http://worldtimeapi.org/api/timezone/Asia/Tokyo`, {
    next: { revalidate: 10 },
  })).json();

   const revalidate0  = await (await fetch(`http://worldtimeapi.org/api/timezone/Asia/Tokyo`)).json();

  return (
    <div className="bg-blue-300 p-4 border-2 border-gray-400 rounded">
        date: {Date.now()} 
      <div>
        <h1 className="mb-5">revalidate10</h1>
        {JSON.stringify(revalidate10)}
        </div>
        <h1 className="mb-5">revalidate0</h1>
        {JSON.stringify(revalidate0)}
    </div>
  );
}