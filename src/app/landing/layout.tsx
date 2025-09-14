import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CREW CUT - Construction Fee Analysis for Developers',
    description: 'The smartest way to find the best locations to build with the lowest fees. Save millions on development costs with LEWIS.',
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
