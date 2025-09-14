import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CREW CUT',
    description: 'Construction fee analysis platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en-US" dir="ltr">
            <body>
                {children}
            </body>
        </html>
    );
}
