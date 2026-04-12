import { useParams } from "react-router-dom";

function Room() {
  const { roomId } = useParams();

  return (
    <div className="h-screen flex">
      
      {/* LEFT - Users */}
      <div className="w-1/5 bg-secondary p-4">
        <h2 className="font-bold mb-4">Users</h2>
        <ul className="space-y-2">
          <li className="bg-tertiary p-2 rounded">User1</li>
          <li className="bg-tertiary p-2 rounded">User2</li>
        </ul>
      </div>

      {/* CENTER - Chat */}
      <div className="w-3/5 flex flex-col justify-between p-4 bg-background">
        <div className="flex-1 overflow-y-auto mb-4">
          <p><strong>User1:</strong> Hello 👋</p>
          <p><strong>User2:</strong> Hi!</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type message..."
            className="flex-1 px-4 py-2 rounded-lg bg-tertiary outline-none focus:bg-secondary"
          />
          <button className="bg-primary text-background px-4 py-2 rounded-lg cursor-pointer">
            Send
          </button>
        </div>
      </div>

      {/* RIGHT - Timer */}
      <div className="w-1/5 bg-secondary p-4 flex flex-col items-center">
        <h2 className="font-bold mb-4">Timer</h2>

        <div className="text-4xl font-bold mb-4">25:00</div>

        <button className="bg-primary cursor-pointer px-4 py-2 rounded-lg text-background">
          Start
        </button>
      </div>

    </div>
  );
}

export default Room;