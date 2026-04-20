import { useState, useEffect } from "react";
import Swal from "sweetalert2";

function MyRoomsModal({
  isOpen,
  onClose,
  myRooms,
  setMyRooms,
  user,
  token,
  navigate,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Lock background scroll only when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRooms = myRooms
    .filter((room) =>
      room.roomId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        className="relative z-10 bg-secondary w-[95%] max-w-2xl rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-primary font-bold text-xl">My Rooms</h2>
          <button
            onClick={onClose}
            className="text-primary text-lg hover:opacity-70 cursor-pointer"
          >
            ✖
          </button>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-xl bg-tertiary text-primary outline-none"
        />

        {/* ROOM LIST */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredRooms.length === 0 ? (
            <p className="text-gray-400 text-sm">No rooms found</p>
          ) : (
            filteredRooms.map((room) => {
              const isCreator = user?.id === room.createdBy;

              return (
                <div
                  key={room._id}
                  className="bg-tertiary px-5 py-3 rounded-full flex justify-between items-center"
                >
                  {/* LEFT */}
                  <div className="flex flex-col items-start">
                    <span className="text-primary font-medium">
                      {room.roomId}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Created ·{" "}
                      {new Date(room.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 items-center">
                    {/* COPY */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.roomId);
                        Swal.fire({
                          toast: true,
                          position: "top-end",
                          icon: "success",
                          title: "Copied!",
                          showConfirmButton: false,
                          timer: 1200,
                          background: "#2b2b2b",
                          color: "#ebedce",
                        });
                      }}
                      className="bg-secondary px-3 py-1 rounded-full text-xs hover:opacity-80 cursor-pointer"
                    >
                      Copy
                    </button>

                    {/* JOIN */}
                    <button
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className="bg-secondary px-4 py-1 rounded-full text-sm hover:opacity-80 cursor-pointer"
                    >
                      Join
                    </button>

                    {/* DELETE (only creator) */}
                    {isCreator && (
                      <button
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: "Delete Room?",
                            text: "This cannot be undone",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#547792",
                            background: "#2b2b2b",
                            color: "#ebedce",
                          });

                          if (result.isConfirmed) {
                            const res = await fetch(
                              `${import.meta.env.VITE_API_URL}/api/rooms/${room.roomId}`,
                              {
                                method: "DELETE",
                                headers: { Authorization: token },
                              }
                            );

                            if (res.ok) {
                              setMyRooms((prev) =>
                                prev.filter((r) => r._id !== room._id)
                              );

                              Swal.fire({
                                title: "Deleted!",
                                icon: "success",
                                background: "#2b2b2b",
                                color: "#ebedce",
                              });
                            }
                          }
                        }}
                        className="bg-red-800 px-3 py-1 rounded-full text-sm text-primary hover:opacity-80 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MyRoomsModal;