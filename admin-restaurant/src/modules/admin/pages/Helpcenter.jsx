import HelpCenterPage from '../../../components/ui/HelpCenterPage';

const guides = [
  {
    id: 1,
    title: 'How to verify new driver documents',
    category: 'Driver Management',
    time: '5 min read',
    content: `
      <h3 class="font-bold text-gray-900 text-base mb-1">1. Identity Verification</h3>
      <p class="mb-3">Ensure candidate drivers provide a valid National ID or Passport. Verify that the photo and personal details match their registration information.</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">2. Check Driving License & Vehicle Documents</h3>
      <p class="mb-3">Inspect the driving license for the appropriate vehicle type (motorcycle or car) along with valid vehicle registration documentation.</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">3. Approval in Admin Panel</h3>
      <p>Navigate to <strong>Driver Management Panel</strong> &rarr; Select drivers with status <em>"Pending"</em> &rarr; Click <strong>Verify</strong> to enable them to receive customer orders.</p>
    `,
  },
  {
    id: 2,
    title: 'Processing manual refunds & chargebacks',
    category: 'Payments',
    time: '3 min read',
    content: `
      <h3 class="font-bold text-gray-900 text-base mb-1">1. Check Transaction History</h3>
      <p class="mb-3">Go to <strong>Payments</strong> &rarr; <strong>Transaction History</strong> and search for the order using Order ID or Customer Name.</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">2. Initiate Refund Request</h3>
      <p class="mb-3">If an item is missing or damaged, click the <strong>Issue Refund</strong> button and enter the corresponding refund amount.</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">3. Confirm Refund</h3>
      <p>The system will process and return the funds to the customer's original payment method (e.g., ABA Pay / E-Wallet) within 24–48 hours.</p>
    `,
  },
  {
    id: 3,
    title: 'Resolving flagged reviews and complaints',
    category: 'Reviews',
    time: '4 min read',
    content: `
      <h3 class="font-bold text-gray-900 text-base mb-1">1. Review Inappropriate Content</h3>
      <p class="mb-3">Reviews containing inappropriate language, profanity, or false claims are automatically routed to the Flagged Section.</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">2. Take Resolution Action</h3>
      <p>Administrators can choose to <strong>Approve</strong> if the review is legitimate or click <strong>Hide/Delete</strong> if it violates platform policy.</p>
    `,
  },
  {
    id: 4,
    title: 'Setting up restaurant commission rates',
    category: 'Restaurants',
    time: '6 min read',
    content: `
      <h3 class="font-bold text-gray-900 text-base mb-1">1. Configure Commission Percentage</h3>
      <p class="mb-3">Navigate to <strong>Restaurants</strong> &rarr; Select Restaurant &rarr; <strong>Edit Profile</strong>, then set the Commission Rate (e.g., 15% or 20%).</p>
      <h3 class="font-bold text-gray-900 text-base mb-1">2. Save Changes</h3>
      <p>Platform commissions for all incoming new orders will automatically be calculated based on the updated percentage rate.</p>
    `,
  },
];

export default function Helpcenter() {
  return (
    <HelpCenterPage
      title="Admin Help Center"
      description="Documentation, SOP guidelines, and technical support for admins."
      bgClass="#fffaf8"
      guides={guides}
    />
  );
}
