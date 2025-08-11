const LoadingBouncing = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[400px]">
      <h2 className="text-2xl font-semibold text-gray-600 mb-6 animate-pulse">
        Cargando...
      </h2>

      <div className="flex space-x-2">
        <span className="w-4 h-4 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-4 h-4 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-4 h-4 bg-gray-500 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
};

export default LoadingBouncing;
