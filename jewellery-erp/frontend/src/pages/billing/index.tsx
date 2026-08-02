import TopBar from './TopBar';
import GoldCalculator from './GoldCalculator';
import SilverCalculator from './SilverCalculator';
import QRScannerPane from './QRScannerPane';
import LiveBillSummary from './LiveBillSummary';
import BillTable from './BillTable';

export default function Billing() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      {/* Dynamic Metadata Row */}
      <TopBar />
      
      {/* Main Grid Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Calculators Column */}
        <div className="flex-[3] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            <QRScannerPane />
            <GoldCalculator />
            <SilverCalculator />
          </div>
          <BillTable />
        </div>

        {/* Live Summary Column */}
        <div className="w-80 flex-shrink-0">
          <LiveBillSummary />
        </div>
      </div>
    </div>
  );
}
