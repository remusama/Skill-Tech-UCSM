import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { EleonorProvider } from "@/contexts/eleonor-context"
import { ClientLayout } from "@/components/layout/ClientLayout"

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata = {
  title: "SkillTech - Plataforma de aprendizaje",
  description: "Plataforma de aprendizaje y gestión de habilidades",
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SkillTech',
    startupImage: [
      {
        url: '/new-logo.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/new-logo.png',
    apple: '/new-logo.png',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        {/* --- PWA IMMERSION ENGINE --- */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* Link Catcher: Prevents iOS from escaping Standalone mode on internal link clicks */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(document,navigator,standalone) {
                if ((standalone in navigator) && navigator[standalone]) {
                  var curnode, location=document.location, stop=/^(a|html)$/i;
                  document.addEventListener('click', function(e) {
                    curnode=e.target;
                    while (!(stop).test(curnode.nodeName)) {
                      curnode=curnode.parentNode;
                      if (!curnode) break;
                    }
                    if(curnode && 'href' in curnode && (curnode.href.indexOf('http') || ~curnode.href.indexOf(location.host)) && (!curnode.classList.contains('external'))) {
                      if (curnode.target !== '_blank') {
                        e.preventDefault();
                        location.href = curnode.href;
                      }
                    }
                  },false);
                }
              })(document,window.navigator,'standalone');
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <EleonorProvider>
            <ClientLayout>{children}</ClientLayout>
          </EleonorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
