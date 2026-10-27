// Ping dari IdleGuard. hooks.server.js sudah memvalidasi dan menggeser sesi;
// kalau sesi habis, hooks mengalihkan ke /login sebelum sampai ke sini.
export function POST() {
	return new Response(null, { status: 204 });
}
