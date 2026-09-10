const Shops = () => {
  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-20 text-[#1F2937]">
      <div className="mx-auto max-w-3xl border border-[#D1D5DB] bg-white px-6 py-12 text-center shadow-sm sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB]">Shops</p>
        <h1 className="mt-3 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">Shops are coming soon</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          Non-restaurant shops are not currently supported by the marketplace backend. Restaurant menus remain available through Delivery.
        </p>
      </div>
    </main>
  );
};

export default Shops;
