import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const metadata: Metadata = { title:'Art Through You — A story written in art', description:'An interactive journey through five eras of art, where six personal choices shape a unique character and transform that character into a portrait inspired by art history.' };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
