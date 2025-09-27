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
      <div className="flex items-end justify-center min-h-[40vh]">
        <ThreeDots label={label} />
      </div>
    </CenteredModal>
  );
}
