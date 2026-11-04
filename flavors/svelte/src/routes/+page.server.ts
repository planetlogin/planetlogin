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

type ConLayout = { tenant?: { config?: { layout?: { hideWatermark?: boolean } } } };

export const load: ServerLoad = ({ locals }) => ({
  appOrigin: process.env.PLANETLOGIN_APP_ORIGIN || '',
  hideWatermark: (locals as ConLayout).tenant?.config?.layout?.hideWatermark ?? false,
});
