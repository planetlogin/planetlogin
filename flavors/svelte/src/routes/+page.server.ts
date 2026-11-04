// Where to hand control back after a successful login. For a subdomain portal the
// app lives on a different origin (auth.example.com → https://example.com), so we
// prepend this trusted origin to the (path-only) return_to. Empty = same origin
// (path-mount / same-host), in which case return_to stays relative.
//
// `hideWatermark` se resuelve AQUI y no en el cliente a proposito: el globo se
// monta con el HTML inicial y dibuja la marca al construirse, asi que para
// cuando llega `/auth/config` ya estaria puesta. Leerlo en el servidor es la
// diferencia entre que no aparezca y que aparezca y se quite a la vista.
//
// Se lee del `locals.tenant.config` ya parseado, sin pasar por los tipos de
// `@planetlogin/core`: el portal se despliega contra la version publicada del
// core, y atarlo a una por publicar convertiria un cambio de una linea en una
// release.
import type { ServerLoad } from '@sveltejs/kit';

type Layout = {
  hideWatermark?: boolean;
  globePosition?: 'left' | 'right' | 'full';
  showSearch?: boolean;
  autoSpin?: boolean;
};
type ConLayout = { tenant?: { config?: { layout?: Layout } } };

// `layout` llevaba tiempo en el esquema y el portal no lo miraba: quien
// escribiera `globePosition: "right"` no veia pasar nada, y nada fallaba.
// Sale del servidor por lo mismo que la marca: el globo lee `search` y
// `autospin` al construirse.
export const load: ServerLoad = ({ locals }) => {
  const l = (locals as ConLayout).tenant?.config?.layout ?? {};
  return {
    appOrigin: process.env.PLANETLOGIN_APP_ORIGIN || '',
    hideWatermark: l.hideWatermark ?? false,
    globePosition: l.globePosition ?? 'left',
    showSearch: l.showSearch ?? true,
    autoSpin: l.autoSpin ?? true,
  };
};
