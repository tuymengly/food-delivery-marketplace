import { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Bug, 
  ChevronRight, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I temporarily pause accepting new orders?',
      answer: 'You can toggle your store status at the top of the sidebar or in Store Settings to "Closed" or "Busy" to temporarily stop receiving incoming orders.'
    },
    {
      id: 2,
      question: 'When will I receive my daily earnings payout?',
      answer: 'Payouts are processed automatically every midnight. Funds will be deposited directly to your linked bank account within 24 hours.'
    },
    {
      id: 3,
      question: 'How do I add new food categories?',
      answer: 'Navigate to the Categories page from the sidebar menu, click the Add Category button, enter details, and save.'
    }
  ];

  return (
    <div className="p-8 bg-[#f9f9fb] min-h-screen space-y-6 text-gray-800">
      {/* Page Title Section */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0f172a]">Help Center</h1>
        <p className="text-xs text-gray-500 font-medium mt-1">
          Documentation, SOP guidelines, and technical support.
        </p>
      </div>

      {/* Main Bright Orange Banner */}
      <div className="bg-[#f05a28] text-white p-10 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">How can we help you today?</h2>

        {/* Search Input inside Banner */}
        <div className="relative w-full max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SOPs, guides, payment issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-800 placeholder-gray-400 rounded-xl text-xs font-medium focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Top Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: SOP Documentation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff4ed] text-[#f05a28] flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0f172a]">SOP Documentation</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Standard operating procedures for managing operations.
              </p>
            </div>
          </div>
          <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-[#f05a28] hover:underline pt-2">
            Browse Documents <ChevronRight size={14} />
          </a>
        </div>

        {/* Card 2: System Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0f172a]">System Status</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                All Systems Operational
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                • Payment Gateways & Maps Active
              </p>
            </div>
          </div>
          <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-[#f05a28] hover:underline pt-2">
            View Live Status <ExternalLink size={13} />
          </a>
        </div>

        {/* Card 3: Report Technical Bug */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Bug size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0f172a]">Report Technical Bug</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Found a bug in dashboard? Send report to dev team.
              </p>
            </div>
          </div>
          <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-[#f05a28] hover:underline pt-2">
            Submit Support Ticket <ChevronRight size={14} />
          </a>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0f172a]">Popular Guides & FAQs</h2>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 bg-[#fafafa] hover:bg-gray-100/70 text-left font-bold text-xs text-gray-800 transition"
              >
                <span>{faq.question}</span>
                {openFaq === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openFaq === faq.id && (
                <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
