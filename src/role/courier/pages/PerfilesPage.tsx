import { CiUser } from 'react-icons/ci';

export default function PerfilesPage() {
  return (
    <section className="mt-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Perfiles</h1>
          <p className="text-gray-500">
            Aqui podras registrar los encargados especificos por modulo.
          </p>
        </div>
        <div className="flex items-end">
          <button className="flex gap-2 items-center bg-primaryDark text-white px-3 py-2 rounded-sm">
            <CiUser />
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      <div>{/* <PerfilesTable /> */}</div>

      {/* <PerfilFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} /> */}
    </section>
  );
}
