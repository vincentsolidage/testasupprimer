import React from "react";

const BotAvatar = () => {
  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-black/80 bg-white">
        <img
          src="/marc_full.png"
          alt="Assistant Avatar"
          className="w-full h-full object-cover"
        />
      </div>
      {/* <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div> */}
    </div>
  );
};

export default BotAvatar;