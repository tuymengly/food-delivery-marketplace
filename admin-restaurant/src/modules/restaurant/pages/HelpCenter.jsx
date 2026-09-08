import HelpCenterPage from '../../../components/ui/HelpCenterPage';

const faqs = [
  {
    id: 1,
    question: 'How do I temporarily pause accepting new orders?',
    answer: 'You can toggle your store status at the top of the sidebar or in Store Settings to "Closed" or "Busy" to temporarily stop receiving incoming orders.',
  },
  {
    id: 2,
    question: 'When will I receive my daily earnings payout?',
    answer: 'Payouts are processed automatically every midnight. Funds will be deposited directly to your linked bank account within 24 hours.',
  },
  {
    id: 3,
    question: 'How do I add new food categories?',
    answer: 'Navigate to the Categories page from the sidebar menu, click the Add Category button, enter details, and save.',
  },
];

export default function HelpCenter() {
  return (
    <HelpCenterPage
      title="Help Center"
      description="Documentation, SOP guidelines, and technical support."
      bgClass="#fcfbfa"
      faqs={faqs}
    />
  );
}
