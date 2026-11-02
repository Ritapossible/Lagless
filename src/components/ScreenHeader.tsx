import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  title: string;
  onBack: () => void;
  backLabel?: string;
  right?: ReactNode;
}

const ScreenHeader = ({ title, onBack, backLabel = "Back", right }: Props) => (
  <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
    <button onClick={onBack} className="btn-quiet -ml-2 justify-self-start">
      <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
      {backLabel}
    </button>
    <h1 className="text-base font-medium">{title}</h1>
    <div className="justify-self-end">{right}</div>
  </header>
);

export default ScreenHeader;
