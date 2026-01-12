import { Icon } from '@iconify/react';
import CenteredModal from '@/shared/common/CenteredModal';
import { ThreeDots } from '@/shared/animations/ThreeDots';

export default function ImportLoadingModal({
  open,
  onClose,
  label = 'Validando datos del Excel…',
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
}) {
  if (!open) return null;
  return (
    <CenteredModal
      title="Verificando datos"
      onClose={onClose}
      widthClass="max-w-xl">
      <div className="flex flex-col items-center justify-center min-h-[30vh] gap-6 py-10">
        <Icon
          icon="mdi:microsoft-excel"
          width="80"
          className="drop-shadow-xl text-gray-600"
        />
        <ThreeDots label={label} />
      </div>
    </CenteredModal>
  );
}
