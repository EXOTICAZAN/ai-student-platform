export default function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-[12px]">
        <span className="bg-transparent px-3 text-slate-500">or continue with email</span>
      </div>
    </div>
  );
}
