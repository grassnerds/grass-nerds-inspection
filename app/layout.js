import './globals.css';

export const metadata = {
  title: 'Grass Nerds - Truck Inspection',
  description: 'Monthly truck inspection checklist for Grass Nerds fleet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
