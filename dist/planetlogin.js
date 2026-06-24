class W {
  constructor() {
    this._partials = new Float64Array(32), this._n = 0;
  }
  add(t) {
    const i = this._partials;
    let e = 0;
    for (let r = 0; r < this._n && r < 32; r++) {
      const o = i[r], l = t + o, u = Math.abs(t) < Math.abs(o) ? t - (l - o) : o - (l - t);
      u && (i[e++] = u), t = l;
    }
    return i[e] = t, this._n = e + 1, this;
  }
  valueOf() {
    const t = this._partials;
    let i = this._n, e, r, o, l = 0;
    if (i > 0) {
      for (l = t[--i]; i > 0 && (e = l, r = t[--i], l = e + r, o = r - (l - e), !o); )
        ;
      i > 0 && (o < 0 && t[i - 1] < 0 || o > 0 && t[i - 1] > 0) && (r = o * 2, e = l + r, r == e - l && (l = e));
    }
    return l;
  }
}
function* Ge(n) {
  for (const t of n)
    yield* t;
}
function pe(n) {
  return Array.from(Ge(n));
}
function ft(n, t, i) {
  n = +n, t = +t, i = (r = arguments.length) < 2 ? (t = n, n = 0, 1) : r < 3 ? 1 : +i;
  for (var e = -1, r = Math.max(0, Math.ceil((t - n) / i)) | 0, o = new Array(r); ++e < r; )
    o[e] = n + e * i;
  return o;
}
var A = 1e-6, It = 1e-12, $ = Math.PI, Z = $ / 2, _t = $ / 4, H = $ * 2, q = 180 / $, F = $ / 180, k = Math.abs, Oe = Math.atan, tt = Math.atan2, R = Math.cos, Ct = Math.ceil, an = Math.hypot, P = Math.sin, We = Math.sign || function(n) {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}, nt = Math.sqrt;
function Xe(n) {
  return n > 1 ? 0 : n < -1 ? $ : Math.acos(n);
}
function at(n) {
  return n > 1 ? Z : n < -1 ? -Z : Math.asin(n);
}
function _() {
}
function Yt(n, t) {
  n && Yn.hasOwnProperty(n.type) && Yn[n.type](n, t);
}
var _n = {
  Feature: function(n, t) {
    Yt(n.geometry, t);
  },
  FeatureCollection: function(n, t) {
    for (var i = n.features, e = -1, r = i.length; ++e < r; ) Yt(i[e].geometry, t);
  }
}, Yn = {
  Sphere: function(n, t) {
    t.sphere();
  },
  Point: function(n, t) {
    n = n.coordinates, t.point(n[0], n[1], n[2]);
  },
  MultiPoint: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) n = i[e], t.point(n[0], n[1], n[2]);
  },
  LineString: function(n, t) {
    ln(n.coordinates, t, 0);
  },
  MultiLineString: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) ln(i[e], t, 0);
  },
  Polygon: function(n, t) {
    Dn(n.coordinates, t);
  },
  MultiPolygon: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) Dn(i[e], t);
  },
  GeometryCollection: function(n, t) {
    for (var i = n.geometries, e = -1, r = i.length; ++e < r; ) Yt(i[e], t);
  }
};
function ln(n, t, i) {
  var e = -1, r = n.length - i, o;
  for (t.lineStart(); ++e < r; ) o = n[e], t.point(o[0], o[1], o[2]);
  t.lineEnd();
}
function Dn(n, t) {
  var i = -1, e = n.length;
  for (t.polygonStart(); ++i < e; ) ln(n[i], t, 1);
  t.polygonEnd();
}
function ot(n, t) {
  n && _n.hasOwnProperty(n.type) ? _n[n.type](n, t) : Yt(n, t);
}
var un = new W(), Dt = new W(), de, ge, cn, fn, hn, Pt = {
  point: _,
  lineStart: _,
  lineEnd: _,
  polygonStart: function() {
    un = new W(), Pt.lineStart = Be, Pt.lineEnd = He;
  },
  polygonEnd: function() {
    var n = +un;
    Dt.add(n < 0 ? H + n : n), this.lineStart = this.lineEnd = this.point = _;
  },
  sphere: function() {
    Dt.add(H);
  }
};
function Be() {
  Pt.point = je;
}
function He() {
  ve(de, ge);
}
function je(n, t) {
  Pt.point = ve, de = n, ge = t, n *= F, t *= F, cn = n, fn = R(t = t / 2 + _t), hn = P(t);
}
function ve(n, t) {
  n *= F, t *= F, t = t / 2 + _t;
  var i = n - cn, e = i >= 0 ? 1 : -1, r = e * i, o = R(t), l = P(t), u = hn * l, g = fn * o + u * R(r), h = u * e * P(r);
  un.add(tt(h, g)), cn = n, fn = o, hn = l;
}
function Ue(n) {
  return Dt = new W(), ot(n, Pt), Dt * 2;
}
function pn(n) {
  return [tt(n[1], n[0]), at(n[2])];
}
function pt(n) {
  var t = n[0], i = n[1], e = R(i);
  return [e * R(t), e * P(t), P(i)];
}
function $t(n, t) {
  return n[0] * t[0] + n[1] * t[1] + n[2] * t[2];
}
function Kt(n, t) {
  return [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
}
function nn(n, t) {
  n[0] += t[0], n[1] += t[1], n[2] += t[2];
}
function Ft(n, t) {
  return [n[0] * t, n[1] * t, n[2] * t];
}
function dn(n) {
  var t = nt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  n[0] /= t, n[1] /= t, n[2] /= t;
}
var mt, Gt, Ot, Wt, Xt, Bt, Ht, jt, gn, vn, mn, me, ye, K, G, O, V = {
  sphere: _,
  point: Tn,
  lineStart: Kn,
  lineEnd: Gn,
  polygonStart: function() {
    V.lineStart = Ve, V.lineEnd = Je;
  },
  polygonEnd: function() {
    V.lineStart = Kn, V.lineEnd = Gn;
  }
};
function Tn(n, t) {
  n *= F, t *= F;
  var i = R(t);
  zt(i * R(n), i * P(n), P(t));
}
function zt(n, t, i) {
  ++mt, Ot += (n - Ot) / mt, Wt += (t - Wt) / mt, Xt += (i - Xt) / mt;
}
function Kn() {
  V.point = Ze;
}
function Ze(n, t) {
  n *= F, t *= F;
  var i = R(t);
  K = i * R(n), G = i * P(n), O = P(t), V.point = qe, zt(K, G, O);
}
function qe(n, t) {
  n *= F, t *= F;
  var i = R(t), e = i * R(n), r = i * P(n), o = P(t), l = tt(nt((l = G * o - O * r) * l + (l = O * e - K * o) * l + (l = K * r - G * e) * l), K * e + G * r + O * o);
  Gt += l, Bt += l * (K + (K = e)), Ht += l * (G + (G = r)), jt += l * (O + (O = o)), zt(K, G, O);
}
function Gn() {
  V.point = Tn;
}
function Ve() {
  V.point = Qe;
}
function Je() {
  Se(me, ye), V.point = Tn;
}
function Qe(n, t) {
  me = n, ye = t, n *= F, t *= F, V.point = Se;
  var i = R(t);
  K = i * R(n), G = i * P(n), O = P(t), zt(K, G, O);
}
function Se(n, t) {
  n *= F, t *= F;
  var i = R(t), e = i * R(n), r = i * P(n), o = P(t), l = G * o - O * r, u = O * e - K * o, g = K * r - G * e, h = an(l, u, g), s = at(h), a = h && -s / h;
  gn.add(a * l), vn.add(a * u), mn.add(a * g), Gt += s, Bt += s * (K + (K = e)), Ht += s * (G + (G = r)), jt += s * (O + (O = o)), zt(K, G, O);
}
function On(n) {
  mt = Gt = Ot = Wt = Xt = Bt = Ht = jt = 0, gn = new W(), vn = new W(), mn = new W(), ot(n, V);
  var t = +gn, i = +vn, e = +mn, r = an(t, i, e);
  return r < It && (t = Bt, i = Ht, e = jt, Gt < A && (t = Ot, i = Wt, e = Xt), r = an(t, i, e), r < It) ? [NaN, NaN] : [tt(i, t) * q, at(e / r) * q];
}
function yn(n, t) {
  function i(e, r) {
    return e = n(e, r), t(e[0], e[1]);
  }
  return n.invert && t.invert && (i.invert = function(e, r) {
    return e = t.invert(e, r), e && n.invert(e[0], e[1]);
  }), i;
}
function Sn(n, t) {
  return k(n) > $ && (n -= Math.round(n / H) * H), [n, t];
}
Sn.invert = Sn;
function ti(n, t, i) {
  return (n %= H) ? t || i ? yn(Xn(n), Bn(t, i)) : Xn(n) : t || i ? Bn(t, i) : Sn;
}
function Wn(n) {
  return function(t, i) {
    return t += n, k(t) > $ && (t -= Math.round(t / H) * H), [t, i];
  };
}
function Xn(n) {
  var t = Wn(n);
  return t.invert = Wn(-n), t;
}
function Bn(n, t) {
  var i = R(n), e = P(n), r = R(t), o = P(t);
  function l(u, g) {
    var h = R(g), s = R(u) * h, a = P(u) * h, c = P(g), f = c * i + s * e;
    return [
      tt(a * r - f * o, s * i - c * e),
      at(f * r + a * o)
    ];
  }
  return l.invert = function(u, g) {
    var h = R(g), s = R(u) * h, a = P(u) * h, c = P(g), f = c * r - a * o;
    return [
      tt(a * r + c * o, s * i + f * e),
      at(f * i - s * e)
    ];
  }, l;
}
function ni(n, t, i, e, r, o) {
  if (i) {
    var l = R(t), u = P(t), g = e * i;
    r == null ? (r = t + e * H, o = t - g / 2) : (r = Hn(l, r), o = Hn(l, o), (e > 0 ? r < o : r > o) && (r += e * H));
    for (var h, s = r; e > 0 ? s > o : s < o; s -= g)
      h = pn([l, -u * R(s), -u * P(s)]), n.point(h[0], h[1]);
  }
}
function Hn(n, t) {
  t = pt(t), t[0] -= n, dn(t);
  var i = Xe(-t[1]);
  return ((-t[2] < 0 ? -i : i) + H - A) % H;
}
function Ee() {
  var n = [], t;
  return {
    point: function(i, e, r) {
      t.push([i, e, r]);
    },
    lineStart: function() {
      n.push(t = []);
    },
    lineEnd: _,
    rejoin: function() {
      n.length > 1 && n.push(n.pop().concat(n.shift()));
    },
    result: function() {
      var i = n;
      return n = [], t = null, i;
    }
  };
}
function Nt(n, t) {
  return k(n[0] - t[0]) < A && k(n[1] - t[1]) < A;
}
function bt(n, t, i, e) {
  this.x = n, this.z = t, this.o = i, this.e = e, this.v = !1, this.n = this.p = null;
}
function we(n, t, i, e, r) {
  var o = [], l = [], u, g;
  if (n.forEach(function(p) {
    if (!((E = p.length - 1) <= 0)) {
      var E, m = p[0], y = p[E], w;
      if (Nt(m, y)) {
        if (!m[2] && !y[2]) {
          for (r.lineStart(), u = 0; u < E; ++u) r.point((m = p[u])[0], m[1]);
          r.lineEnd();
          return;
        }
        y[0] += 2 * A;
      }
      o.push(w = new bt(m, p, null, !0)), l.push(w.o = new bt(m, null, w, !1)), o.push(w = new bt(y, p, null, !1)), l.push(w.o = new bt(y, null, w, !0));
    }
  }), !!o.length) {
    for (l.sort(t), jn(o), jn(l), u = 0, g = l.length; u < g; ++u)
      l[u].e = i = !i;
    for (var h = o[0], s, a; ; ) {
      for (var c = h, f = !0; c.v; ) if ((c = c.n) === h) return;
      s = c.z, r.lineStart();
      do {
        if (c.v = c.o.v = !0, c.e) {
          if (f)
            for (u = 0, g = s.length; u < g; ++u) r.point((a = s[u])[0], a[1]);
          else
            e(c.x, c.n.x, 1, r);
          c = c.n;
        } else {
          if (f)
            for (s = c.p.z, u = s.length - 1; u >= 0; --u) r.point((a = s[u])[0], a[1]);
          else
            e(c.x, c.p.x, -1, r);
          c = c.p;
        }
        c = c.o, s = c.z, f = !f;
      } while (!c.v);
      r.lineEnd();
    }
  }
}
function jn(n) {
  if (t = n.length) {
    for (var t, i = 0, e = n[0], r; ++i < t; )
      e.n = r = n[i], r.p = e, e = r;
    e.n = r = n[0], r.p = e;
  }
}
function en(n) {
  return k(n[0]) <= $ ? n[0] : We(n[0]) * ((k(n[0]) + $) % H - $);
}
function Me(n, t) {
  var i = en(t), e = t[1], r = P(e), o = [P(i), -R(i), 0], l = 0, u = 0, g = new W();
  r === 1 ? e = Z + A : r === -1 && (e = -Z - A);
  for (var h = 0, s = n.length; h < s; ++h)
    if (c = (a = n[h]).length)
      for (var a, c, f = a[c - 1], p = en(f), E = f[1] / 2 + _t, m = P(E), y = R(E), w = 0; w < c; ++w, p = S, m = z, y = N, f = v) {
        var v = a[w], S = en(v), L = v[1] / 2 + _t, z = P(L), N = R(L), b = S - p, x = b >= 0 ? 1 : -1, I = x * b, M = I > $, X = m * z;
        if (g.add(tt(X * x * P(I), y * N + X * R(I))), l += M ? b + x * H : b, M ^ p >= i ^ S >= i) {
          var Y = Kt(pt(f), pt(v));
          dn(Y);
          var T = Kt(o, Y);
          dn(T);
          var d = (M ^ b >= 0 ? -1 : 1) * at(T[2]);
          (e > d || e === d && (Y[0] || Y[1])) && (u += M ^ b >= 0 ? 1 : -1);
        }
      }
  return (l < -A || l < A && g < -It) ^ u & 1;
}
function Pe(n, t, i, e) {
  return function(r) {
    var o = t(r), l = Ee(), u = t(l), g = !1, h, s, a, c = {
      point: f,
      lineStart: E,
      lineEnd: m,
      polygonStart: function() {
        c.point = y, c.lineStart = w, c.lineEnd = v, s = [], h = [];
      },
      polygonEnd: function() {
        c.point = f, c.lineStart = E, c.lineEnd = m, s = pe(s);
        var S = Me(h, e);
        s.length ? (g || (r.polygonStart(), g = !0), we(s, ii, S, i, r)) : S && (g || (r.polygonStart(), g = !0), r.lineStart(), i(null, null, 1, r), r.lineEnd()), g && (r.polygonEnd(), g = !1), s = h = null;
      },
      sphere: function() {
        r.polygonStart(), r.lineStart(), i(null, null, 1, r), r.lineEnd(), r.polygonEnd();
      }
    };
    function f(S, L) {
      n(S, L) && r.point(S, L);
    }
    function p(S, L) {
      o.point(S, L);
    }
    function E() {
      c.point = p, o.lineStart();
    }
    function m() {
      c.point = f, o.lineEnd();
    }
    function y(S, L) {
      a.push([S, L]), u.point(S, L);
    }
    function w() {
      u.lineStart(), a = [];
    }
    function v() {
      y(a[0][0], a[0][1]), u.lineEnd();
      var S = u.clean(), L = l.result(), z, N = L.length, b, x, I;
      if (a.pop(), h.push(a), a = null, !!N) {
        if (S & 1) {
          if (x = L[0], (b = x.length - 1) > 0) {
            for (g || (r.polygonStart(), g = !0), r.lineStart(), z = 0; z < b; ++z) r.point((I = x[z])[0], I[1]);
            r.lineEnd();
          }
          return;
        }
        N > 1 && S & 2 && L.push(L.pop().concat(L.shift())), s.push(L.filter(ei));
      }
    }
    return c;
  };
}
function ei(n) {
  return n.length > 1;
}
function ii(n, t) {
  return ((n = n.x)[0] < 0 ? n[1] - Z - A : Z - n[1]) - ((t = t.x)[0] < 0 ? t[1] - Z - A : Z - t[1]);
}
const Un = Pe(
  function() {
    return !0;
  },
  ri,
  si,
  [-$, -Z]
);
function ri(n) {
  var t = NaN, i = NaN, e = NaN, r;
  return {
    lineStart: function() {
      n.lineStart(), r = 1;
    },
    point: function(o, l) {
      var u = o > 0 ? $ : -$, g = k(o - t);
      k(g - $) < A ? (n.point(t, i = (i + l) / 2 > 0 ? Z : -Z), n.point(e, i), n.lineEnd(), n.lineStart(), n.point(u, i), n.point(o, i), r = 0) : e !== u && g >= $ && (k(t - e) < A && (t -= e * A), k(o - u) < A && (o -= u * A), i = oi(t, i, o, l), n.point(e, i), n.lineEnd(), n.lineStart(), n.point(u, i), r = 0), n.point(t = o, i = l), e = u;
    },
    lineEnd: function() {
      n.lineEnd(), t = i = NaN;
    },
    clean: function() {
      return 2 - r;
    }
  };
}
function oi(n, t, i, e) {
  var r, o, l = P(n - i);
  return k(l) > A ? Oe((P(t) * (o = R(e)) * P(i) - P(e) * (r = R(t)) * P(n)) / (r * o * l)) : (t + e) / 2;
}
function si(n, t, i, e) {
  var r;
  if (n == null)
    r = i * Z, e.point(-$, r), e.point(0, r), e.point($, r), e.point($, 0), e.point($, -r), e.point(0, -r), e.point(-$, -r), e.point(-$, 0), e.point(-$, r);
  else if (k(n[0] - t[0]) > A) {
    var o = n[0] < t[0] ? $ : -$;
    r = i * o / 2, e.point(-o, r), e.point(0, r), e.point(o, r);
  } else
    e.point(t[0], t[1]);
}
function ai(n) {
  var t = R(n), i = 2 * F, e = t > 0, r = k(t) > A;
  function o(s, a, c, f) {
    ni(f, n, i, c, s, a);
  }
  function l(s, a) {
    return R(s) * R(a) > t;
  }
  function u(s) {
    var a, c, f, p, E;
    return {
      lineStart: function() {
        p = f = !1, E = 1;
      },
      point: function(m, y) {
        var w = [m, y], v, S = l(m, y), L = e ? S ? 0 : h(m, y) : S ? h(m + (m < 0 ? $ : -$), y) : 0;
        if (!a && (p = f = S) && s.lineStart(), S !== f && (v = g(a, w), (!v || Nt(a, v) || Nt(w, v)) && (w[2] = 1)), S !== f)
          E = 0, S ? (s.lineStart(), v = g(w, a), s.point(v[0], v[1])) : (v = g(a, w), s.point(v[0], v[1], 2), s.lineEnd()), a = v;
        else if (r && a && e ^ S) {
          var z;
          !(L & c) && (z = g(w, a, !0)) && (E = 0, e ? (s.lineStart(), s.point(z[0][0], z[0][1]), s.point(z[1][0], z[1][1]), s.lineEnd()) : (s.point(z[1][0], z[1][1]), s.lineEnd(), s.lineStart(), s.point(z[0][0], z[0][1], 3)));
        }
        S && (!a || !Nt(a, w)) && s.point(w[0], w[1]), a = w, f = S, c = L;
      },
      lineEnd: function() {
        f && s.lineEnd(), a = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return E | (p && f) << 1;
      }
    };
  }
  function g(s, a, c) {
    var f = pt(s), p = pt(a), E = [1, 0, 0], m = Kt(f, p), y = $t(m, m), w = m[0], v = y - w * w;
    if (!v) return !c && s;
    var S = t * y / v, L = -t * w / v, z = Kt(E, m), N = Ft(E, S), b = Ft(m, L);
    nn(N, b);
    var x = z, I = $t(N, x), M = $t(x, x), X = I * I - M * ($t(N, N) - 1);
    if (!(X < 0)) {
      var Y = nt(X), T = Ft(x, (-I - Y) / M);
      if (nn(T, N), T = pn(T), !c) return T;
      var d = s[0], C = a[0], D = s[1], B = a[1], j;
      C < d && (j = d, d = C, C = j);
      var vt = C - d, et = k(vt - $) < A, lt = et || vt < A;
      if (!et && B < D && (j = D, D = B, B = j), lt ? et ? D + B > 0 ^ T[1] < (k(T[0] - d) < A ? D : B) : D <= T[1] && T[1] <= B : vt > $ ^ (d <= T[0] && T[0] <= C)) {
        var it = Ft(x, (-I + Y) / M);
        return nn(it, N), [T, pn(it)];
      }
    }
  }
  function h(s, a) {
    var c = e ? n : $ - n, f = 0;
    return s < -c ? f |= 1 : s > c && (f |= 2), a < -c ? f |= 4 : a > c && (f |= 8), f;
  }
  return Pe(l, u, o, e ? [0, -n] : [-$, n - $]);
}
function li(n, t, i, e, r, o) {
  var l = n[0], u = n[1], g = t[0], h = t[1], s = 0, a = 1, c = g - l, f = h - u, p;
  if (p = i - l, !(!c && p > 0)) {
    if (p /= c, c < 0) {
      if (p < s) return;
      p < a && (a = p);
    } else if (c > 0) {
      if (p > a) return;
      p > s && (s = p);
    }
    if (p = r - l, !(!c && p < 0)) {
      if (p /= c, c < 0) {
        if (p > a) return;
        p > s && (s = p);
      } else if (c > 0) {
        if (p < s) return;
        p < a && (a = p);
      }
      if (p = e - u, !(!f && p > 0)) {
        if (p /= f, f < 0) {
          if (p < s) return;
          p < a && (a = p);
        } else if (f > 0) {
          if (p > a) return;
          p > s && (s = p);
        }
        if (p = o - u, !(!f && p < 0)) {
          if (p /= f, f < 0) {
            if (p > a) return;
            p > s && (s = p);
          } else if (f > 0) {
            if (p < s) return;
            p < a && (a = p);
          }
          return s > 0 && (n[0] = l + s * c, n[1] = u + s * f), a < 1 && (t[0] = l + a * c, t[1] = u + a * f), !0;
        }
      }
    }
  }
}
var yt = 1e9, xt = -yt;
function ui(n, t, i, e) {
  function r(h, s) {
    return n <= h && h <= i && t <= s && s <= e;
  }
  function o(h, s, a, c) {
    var f = 0, p = 0;
    if (h == null || (f = l(h, a)) !== (p = l(s, a)) || g(h, s) < 0 ^ a > 0)
      do
        c.point(f === 0 || f === 3 ? n : i, f > 1 ? e : t);
      while ((f = (f + a + 4) % 4) !== p);
    else
      c.point(s[0], s[1]);
  }
  function l(h, s) {
    return k(h[0] - n) < A ? s > 0 ? 0 : 3 : k(h[0] - i) < A ? s > 0 ? 2 : 1 : k(h[1] - t) < A ? s > 0 ? 1 : 0 : s > 0 ? 3 : 2;
  }
  function u(h, s) {
    return g(h.x, s.x);
  }
  function g(h, s) {
    var a = l(h, 1), c = l(s, 1);
    return a !== c ? a - c : a === 0 ? s[1] - h[1] : a === 1 ? h[0] - s[0] : a === 2 ? h[1] - s[1] : s[0] - h[0];
  }
  return function(h) {
    var s = h, a = Ee(), c, f, p, E, m, y, w, v, S, L, z, N = {
      point: b,
      lineStart: X,
      lineEnd: Y,
      polygonStart: I,
      polygonEnd: M
    };
    function b(d, C) {
      r(d, C) && s.point(d, C);
    }
    function x() {
      for (var d = 0, C = 0, D = f.length; C < D; ++C)
        for (var B = f[C], j = 1, vt = B.length, et = B[0], lt, it, At = et[0], ct = et[1]; j < vt; ++j)
          lt = At, it = ct, et = B[j], At = et[0], ct = et[1], it <= e ? ct > e && (At - lt) * (e - it) > (ct - it) * (n - lt) && ++d : ct <= e && (At - lt) * (e - it) < (ct - it) * (n - lt) && --d;
      return d;
    }
    function I() {
      s = a, c = [], f = [], z = !0;
    }
    function M() {
      var d = x(), C = z && d, D = (c = pe(c)).length;
      (C || D) && (h.polygonStart(), C && (h.lineStart(), o(null, null, 1, h), h.lineEnd()), D && we(c, u, d, o, h), h.polygonEnd()), s = h, c = f = p = null;
    }
    function X() {
      N.point = T, f && f.push(p = []), L = !0, S = !1, w = v = NaN;
    }
    function Y() {
      c && (T(E, m), y && S && a.rejoin(), c.push(a.result())), N.point = b, S && s.lineEnd();
    }
    function T(d, C) {
      var D = r(d, C);
      if (f && p.push([d, C]), L)
        E = d, m = C, y = D, L = !1, D && (s.lineStart(), s.point(d, C));
      else if (D && S) s.point(d, C);
      else {
        var B = [w = Math.max(xt, Math.min(yt, w)), v = Math.max(xt, Math.min(yt, v))], j = [d = Math.max(xt, Math.min(yt, d)), C = Math.max(xt, Math.min(yt, C))];
        li(B, j, n, t, i, e) ? (S || (s.lineStart(), s.point(B[0], B[1])), s.point(j[0], j[1]), D || s.lineEnd(), z = !1) : D && (s.lineStart(), s.point(d, C), z = !1);
      }
      w = d, v = C, S = D;
    }
    return N;
  };
}
var En, wn, Tt, kt, dt = {
  sphere: _,
  point: _,
  lineStart: ci,
  lineEnd: _,
  polygonStart: _,
  polygonEnd: _
};
function ci() {
  dt.point = hi, dt.lineEnd = fi;
}
function fi() {
  dt.point = dt.lineEnd = _;
}
function hi(n, t) {
  n *= F, t *= F, wn = n, Tt = P(t), kt = R(t), dt.point = pi;
}
function pi(n, t) {
  n *= F, t *= F;
  var i = P(t), e = R(t), r = k(n - wn), o = R(r), l = P(r), u = e * l, g = kt * i - Tt * e * o, h = Tt * i + kt * e * o;
  En.add(tt(nt(u * u + g * g), h)), wn = n, Tt = i, kt = e;
}
function di(n) {
  return En = new W(), ot(n, dt), +En;
}
var Mn = [null, null], gi = { type: "LineString", coordinates: Mn };
function Pn(n, t) {
  return Mn[0] = n, Mn[1] = t, di(gi);
}
var Zn = {
  Feature: function(n, t) {
    return Ut(n.geometry, t);
  },
  FeatureCollection: function(n, t) {
    for (var i = n.features, e = -1, r = i.length; ++e < r; ) if (Ut(i[e].geometry, t)) return !0;
    return !1;
  }
}, qn = {
  Sphere: function() {
    return !0;
  },
  Point: function(n, t) {
    return Vn(n.coordinates, t);
  },
  MultiPoint: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) if (Vn(i[e], t)) return !0;
    return !1;
  },
  LineString: function(n, t) {
    return Jn(n.coordinates, t);
  },
  MultiLineString: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) if (Jn(i[e], t)) return !0;
    return !1;
  },
  Polygon: function(n, t) {
    return Qn(n.coordinates, t);
  },
  MultiPolygon: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) if (Qn(i[e], t)) return !0;
    return !1;
  },
  GeometryCollection: function(n, t) {
    for (var i = n.geometries, e = -1, r = i.length; ++e < r; ) if (Ut(i[e], t)) return !0;
    return !1;
  }
};
function Ut(n, t) {
  return n && qn.hasOwnProperty(n.type) ? qn[n.type](n, t) : !1;
}
function Vn(n, t) {
  return Pn(n, t) === 0;
}
function Jn(n, t) {
  for (var i, e, r, o = 0, l = n.length; o < l; o++) {
    if (e = Pn(n[o], t), e === 0 || o > 0 && (r = Pn(n[o], n[o - 1]), r > 0 && i <= r && e <= r && (i + e - r) * (1 - Math.pow((i - e) / r, 2)) < It * r))
      return !0;
    i = e;
  }
  return !1;
}
function Qn(n, t) {
  return !!Me(n.map(vi), Re(t));
}
function vi(n) {
  return n = n.map(Re), n.pop(), n;
}
function Re(n) {
  return [n[0] * F, n[1] * F];
}
function rn(n, t) {
  return (n && Zn.hasOwnProperty(n.type) ? Zn[n.type] : Ut)(n, t);
}
function te(n, t, i) {
  var e = ft(n, t - A, i).concat(t);
  return function(r) {
    return e.map(function(o) {
      return [r, o];
    });
  };
}
function ne(n, t, i) {
  var e = ft(n, t - A, i).concat(t);
  return function(r) {
    return e.map(function(o) {
      return [o, r];
    });
  };
}
function mi() {
  var n, t, i, e, r, o, l, u, g = 10, h = g, s = 90, a = 360, c, f, p, E, m = 2.5;
  function y() {
    return { type: "MultiLineString", coordinates: w() };
  }
  function w() {
    return ft(Ct(e / s) * s, i, s).map(p).concat(ft(Ct(u / a) * a, l, a).map(E)).concat(ft(Ct(t / g) * g, n, g).filter(function(v) {
      return k(v % s) > A;
    }).map(c)).concat(ft(Ct(o / h) * h, r, h).filter(function(v) {
      return k(v % a) > A;
    }).map(f));
  }
  return y.lines = function() {
    return w().map(function(v) {
      return { type: "LineString", coordinates: v };
    });
  }, y.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        p(e).concat(
          E(l).slice(1),
          p(i).reverse().slice(1),
          E(u).reverse().slice(1)
        )
      ]
    };
  }, y.extent = function(v) {
    return arguments.length ? y.extentMajor(v).extentMinor(v) : y.extentMinor();
  }, y.extentMajor = function(v) {
    return arguments.length ? (e = +v[0][0], i = +v[1][0], u = +v[0][1], l = +v[1][1], e > i && (v = e, e = i, i = v), u > l && (v = u, u = l, l = v), y.precision(m)) : [[e, u], [i, l]];
  }, y.extentMinor = function(v) {
    return arguments.length ? (t = +v[0][0], n = +v[1][0], o = +v[0][1], r = +v[1][1], t > n && (v = t, t = n, n = v), o > r && (v = o, o = r, r = v), y.precision(m)) : [[t, o], [n, r]];
  }, y.step = function(v) {
    return arguments.length ? y.stepMajor(v).stepMinor(v) : y.stepMinor();
  }, y.stepMajor = function(v) {
    return arguments.length ? (s = +v[0], a = +v[1], y) : [s, a];
  }, y.stepMinor = function(v) {
    return arguments.length ? (g = +v[0], h = +v[1], y) : [g, h];
  }, y.precision = function(v) {
    return arguments.length ? (m = +v, c = te(o, r, 90), f = ne(t, n, m), p = te(u, l, 90), E = ne(e, i, m), y) : m;
  }, y.extentMajor([[-180, -90 + A], [180, 90 - A]]).extentMinor([[-180, -80 - A], [180, 80 + A]]);
}
function yi() {
  return mi()();
}
const Rn = (n) => n;
var on = new W(), Ln = new W(), Le, ze, zn, An, st = {
  point: _,
  lineStart: _,
  lineEnd: _,
  polygonStart: function() {
    st.lineStart = Si, st.lineEnd = wi;
  },
  polygonEnd: function() {
    st.lineStart = st.lineEnd = st.point = _, on.add(k(Ln)), Ln = new W();
  },
  result: function() {
    var n = on / 2;
    return on = new W(), n;
  }
};
function Si() {
  st.point = Ei;
}
function Ei(n, t) {
  st.point = Ae, Le = zn = n, ze = An = t;
}
function Ae(n, t) {
  Ln.add(An * n - zn * t), zn = n, An = t;
}
function wi() {
  Ae(Le, ze);
}
var gt = 1 / 0, Zt = gt, Rt = -gt, qt = Rt, Vt = {
  point: Mi,
  lineStart: _,
  lineEnd: _,
  polygonStart: _,
  polygonEnd: _,
  result: function() {
    var n = [[gt, Zt], [Rt, qt]];
    return Rt = qt = -(Zt = gt = 1 / 0), n;
  }
};
function Mi(n, t) {
  n < gt && (gt = n), n > Rt && (Rt = n), t < Zt && (Zt = t), t > qt && (qt = t);
}
var Cn = 0, $n = 0, St = 0, Jt = 0, Qt = 0, ht = 0, Fn = 0, bn = 0, Et = 0, Ce, $e, J, Q, U = {
  point: ut,
  lineStart: ee,
  lineEnd: ie,
  polygonStart: function() {
    U.lineStart = Li, U.lineEnd = zi;
  },
  polygonEnd: function() {
    U.point = ut, U.lineStart = ee, U.lineEnd = ie;
  },
  result: function() {
    var n = Et ? [Fn / Et, bn / Et] : ht ? [Jt / ht, Qt / ht] : St ? [Cn / St, $n / St] : [NaN, NaN];
    return Cn = $n = St = Jt = Qt = ht = Fn = bn = Et = 0, n;
  }
};
function ut(n, t) {
  Cn += n, $n += t, ++St;
}
function ee() {
  U.point = Pi;
}
function Pi(n, t) {
  U.point = Ri, ut(J = n, Q = t);
}
function Ri(n, t) {
  var i = n - J, e = t - Q, r = nt(i * i + e * e);
  Jt += r * (J + n) / 2, Qt += r * (Q + t) / 2, ht += r, ut(J = n, Q = t);
}
function ie() {
  U.point = ut;
}
function Li() {
  U.point = Ai;
}
function zi() {
  Fe(Ce, $e);
}
function Ai(n, t) {
  U.point = Fe, ut(Ce = J = n, $e = Q = t);
}
function Fe(n, t) {
  var i = n - J, e = t - Q, r = nt(i * i + e * e);
  Jt += r * (J + n) / 2, Qt += r * (Q + t) / 2, ht += r, r = Q * n - J * t, Fn += r * (J + n), bn += r * (Q + t), Et += r * 3, ut(J = n, Q = t);
}
function be(n) {
  this._context = n;
}
be.prototype = {
  _radius: 4.5,
  pointRadius: function(n) {
    return this._radius = n, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    this._line === 0 && this._context.closePath(), this._point = NaN;
  },
  point: function(n, t) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(n, t), this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(n, t);
        break;
      }
      default: {
        this._context.moveTo(n + this._radius, t), this._context.arc(n, t, this._radius, 0, H);
        break;
      }
    }
  },
  result: _
};
var xn = new W(), sn, xe, Ne, wt, Mt, Lt = {
  point: _,
  lineStart: function() {
    Lt.point = Ci;
  },
  lineEnd: function() {
    sn && Te(xe, Ne), Lt.point = _;
  },
  polygonStart: function() {
    sn = !0;
  },
  polygonEnd: function() {
    sn = null;
  },
  result: function() {
    var n = +xn;
    return xn = new W(), n;
  }
};
function Ci(n, t) {
  Lt.point = Te, xe = wt = n, Ne = Mt = t;
}
function Te(n, t) {
  wt -= n, Mt -= t, xn.add(nt(wt * wt + Mt * Mt)), wt = n, Mt = t;
}
let re, tn, oe, se;
class ae {
  constructor(t) {
    this._append = t == null ? ke : $i(t), this._radius = 4.5, this._ = "";
  }
  pointRadius(t) {
    return this._radius = +t, this;
  }
  polygonStart() {
    this._line = 0;
  }
  polygonEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    this._line === 0 && (this._ += "Z"), this._point = NaN;
  }
  point(t, i) {
    switch (this._point) {
      case 0: {
        this._append`M${t},${i}`, this._point = 1;
        break;
      }
      case 1: {
        this._append`L${t},${i}`;
        break;
      }
      default: {
        if (this._append`M${t},${i}`, this._radius !== oe || this._append !== tn) {
          const e = this._radius, r = this._;
          this._ = "", this._append`m0,${e}a${e},${e} 0 1,1 0,${-2 * e}a${e},${e} 0 1,1 0,${2 * e}z`, oe = e, tn = this._append, se = this._, this._ = r;
        }
        this._ += se;
        break;
      }
    }
  }
  result() {
    const t = this._;
    return this._ = "", t.length ? t : null;
  }
}
function ke(n) {
  let t = 1;
  this._ += n[0];
  for (const i = n.length; t < i; ++t)
    this._ += arguments[t] + n[t];
}
function $i(n) {
  const t = Math.floor(n);
  if (!(t >= 0)) throw new RangeError(`invalid digits: ${n}`);
  if (t > 15) return ke;
  if (t !== re) {
    const i = 10 ** t;
    re = t, tn = function(r) {
      let o = 1;
      this._ += r[0];
      for (const l = r.length; o < l; ++o)
        this._ += Math.round(arguments[o] * i) / i + r[o];
    };
  }
  return tn;
}
function Fi(n, t) {
  let i = 3, e = 4.5, r, o;
  function l(u) {
    return u && (typeof e == "function" && o.pointRadius(+e.apply(this, arguments)), ot(u, r(o))), o.result();
  }
  return l.area = function(u) {
    return ot(u, r(st)), st.result();
  }, l.measure = function(u) {
    return ot(u, r(Lt)), Lt.result();
  }, l.bounds = function(u) {
    return ot(u, r(Vt)), Vt.result();
  }, l.centroid = function(u) {
    return ot(u, r(U)), U.result();
  }, l.projection = function(u) {
    return arguments.length ? (r = u == null ? (n = null, Rn) : (n = u).stream, l) : n;
  }, l.context = function(u) {
    return arguments.length ? (o = u == null ? (t = null, new ae(i)) : new be(t = u), typeof e != "function" && o.pointRadius(e), l) : t;
  }, l.pointRadius = function(u) {
    return arguments.length ? (e = typeof u == "function" ? u : (o.pointRadius(+u), +u), l) : e;
  }, l.digits = function(u) {
    if (!arguments.length) return i;
    if (u == null) i = null;
    else {
      const g = Math.floor(u);
      if (!(g >= 0)) throw new RangeError(`invalid digits: ${u}`);
      i = g;
    }
    return t === null && (o = new ae(i)), l;
  }, l.projection(n).digits(i).context(t);
}
function kn(n) {
  return function(t) {
    var i = new Nn();
    for (var e in n) i[e] = n[e];
    return i.stream = t, i;
  };
}
function Nn() {
}
Nn.prototype = {
  constructor: Nn,
  point: function(n, t) {
    this.stream.point(n, t);
  },
  sphere: function() {
    this.stream.sphere();
  },
  lineStart: function() {
    this.stream.lineStart();
  },
  lineEnd: function() {
    this.stream.lineEnd();
  },
  polygonStart: function() {
    this.stream.polygonStart();
  },
  polygonEnd: function() {
    this.stream.polygonEnd();
  }
};
function In(n, t, i) {
  var e = n.clipExtent && n.clipExtent();
  return n.scale(150).translate([0, 0]), e != null && n.clipExtent(null), ot(i, n.stream(Vt)), t(Vt.result()), e != null && n.clipExtent(e), n;
}
function Ie(n, t, i) {
  return In(n, function(e) {
    var r = t[1][0] - t[0][0], o = t[1][1] - t[0][1], l = Math.min(r / (e[1][0] - e[0][0]), o / (e[1][1] - e[0][1])), u = +t[0][0] + (r - l * (e[1][0] + e[0][0])) / 2, g = +t[0][1] + (o - l * (e[1][1] + e[0][1])) / 2;
    n.scale(150 * l).translate([u, g]);
  }, i);
}
function bi(n, t, i) {
  return Ie(n, [[0, 0], t], i);
}
function xi(n, t, i) {
  return In(n, function(e) {
    var r = +t, o = r / (e[1][0] - e[0][0]), l = (r - o * (e[1][0] + e[0][0])) / 2, u = -o * e[0][1];
    n.scale(150 * o).translate([l, u]);
  }, i);
}
function Ni(n, t, i) {
  return In(n, function(e) {
    var r = +t, o = r / (e[1][1] - e[0][1]), l = -o * e[0][0], u = (r - o * (e[1][1] + e[0][1])) / 2;
    n.scale(150 * o).translate([l, u]);
  }, i);
}
var le = 16, Ti = R(30 * F);
function ue(n, t) {
  return +t ? Ii(n, t) : ki(n);
}
function ki(n) {
  return kn({
    point: function(t, i) {
      t = n(t, i), this.stream.point(t[0], t[1]);
    }
  });
}
function Ii(n, t) {
  function i(e, r, o, l, u, g, h, s, a, c, f, p, E, m) {
    var y = h - e, w = s - r, v = y * y + w * w;
    if (v > 4 * t && E--) {
      var S = l + c, L = u + f, z = g + p, N = nt(S * S + L * L + z * z), b = at(z /= N), x = k(k(z) - 1) < A || k(o - a) < A ? (o + a) / 2 : tt(L, S), I = n(x, b), M = I[0], X = I[1], Y = M - e, T = X - r, d = w * Y - y * T;
      (d * d / v > t || k((y * Y + w * T) / v - 0.5) > 0.3 || l * c + u * f + g * p < Ti) && (i(e, r, o, l, u, g, M, X, x, S /= N, L /= N, z, E, m), m.point(M, X), i(M, X, x, S, L, z, h, s, a, c, f, p, E, m));
    }
  }
  return function(e) {
    var r, o, l, u, g, h, s, a, c, f, p, E, m = {
      point: y,
      lineStart: w,
      lineEnd: S,
      polygonStart: function() {
        e.polygonStart(), m.lineStart = L;
      },
      polygonEnd: function() {
        e.polygonEnd(), m.lineStart = w;
      }
    };
    function y(b, x) {
      b = n(b, x), e.point(b[0], b[1]);
    }
    function w() {
      a = NaN, m.point = v, e.lineStart();
    }
    function v(b, x) {
      var I = pt([b, x]), M = n(b, x);
      i(a, c, s, f, p, E, a = M[0], c = M[1], s = b, f = I[0], p = I[1], E = I[2], le, e), e.point(a, c);
    }
    function S() {
      m.point = y, e.lineEnd();
    }
    function L() {
      w(), m.point = z, m.lineEnd = N;
    }
    function z(b, x) {
      v(r = b, x), o = a, l = c, u = f, g = p, h = E, m.point = v;
    }
    function N() {
      i(a, c, s, f, p, E, o, l, r, u, g, h, le, e), m.lineEnd = S, S();
    }
    return m;
  };
}
var _i = kn({
  point: function(n, t) {
    this.stream.point(n * F, t * F);
  }
});
function Yi(n) {
  return kn({
    point: function(t, i) {
      var e = n(t, i);
      return this.stream.point(e[0], e[1]);
    }
  });
}
function Di(n, t, i, e, r) {
  function o(l, u) {
    return l *= e, u *= r, [t + n * l, i - n * u];
  }
  return o.invert = function(l, u) {
    return [(l - t) / n * e, (i - u) / n * r];
  }, o;
}
function ce(n, t, i, e, r, o) {
  if (!o) return Di(n, t, i, e, r);
  var l = R(o), u = P(o), g = l * n, h = u * n, s = l / n, a = u / n, c = (u * i - l * t) / n, f = (u * t + l * i) / n;
  function p(E, m) {
    return E *= e, m *= r, [g * E - h * m + t, i - h * E - g * m];
  }
  return p.invert = function(E, m) {
    return [e * (s * E - a * m + c), r * (f - a * E - s * m)];
  }, p;
}
function Ki(n) {
  return Gi(function() {
    return n;
  })();
}
function Gi(n) {
  var t, i = 150, e = 480, r = 250, o = 0, l = 0, u = 0, g = 0, h = 0, s, a = 0, c = 1, f = 1, p = null, E = Un, m = null, y, w, v, S = Rn, L = 0.5, z, N, b, x, I;
  function M(d) {
    return b(d[0] * F, d[1] * F);
  }
  function X(d) {
    return d = b.invert(d[0], d[1]), d && [d[0] * q, d[1] * q];
  }
  M.stream = function(d) {
    return x && I === d ? x : x = _i(Yi(s)(E(z(S(I = d)))));
  }, M.preclip = function(d) {
    return arguments.length ? (E = d, p = void 0, T()) : E;
  }, M.postclip = function(d) {
    return arguments.length ? (S = d, m = y = w = v = null, T()) : S;
  }, M.clipAngle = function(d) {
    return arguments.length ? (E = +d ? ai(p = d * F) : (p = null, Un), T()) : p * q;
  }, M.clipExtent = function(d) {
    return arguments.length ? (S = d == null ? (m = y = w = v = null, Rn) : ui(m = +d[0][0], y = +d[0][1], w = +d[1][0], v = +d[1][1]), T()) : m == null ? null : [[m, y], [w, v]];
  }, M.scale = function(d) {
    return arguments.length ? (i = +d, Y()) : i;
  }, M.translate = function(d) {
    return arguments.length ? (e = +d[0], r = +d[1], Y()) : [e, r];
  }, M.center = function(d) {
    return arguments.length ? (o = d[0] % 360 * F, l = d[1] % 360 * F, Y()) : [o * q, l * q];
  }, M.rotate = function(d) {
    return arguments.length ? (u = d[0] % 360 * F, g = d[1] % 360 * F, h = d.length > 2 ? d[2] % 360 * F : 0, Y()) : [u * q, g * q, h * q];
  }, M.angle = function(d) {
    return arguments.length ? (a = d % 360 * F, Y()) : a * q;
  }, M.reflectX = function(d) {
    return arguments.length ? (c = d ? -1 : 1, Y()) : c < 0;
  }, M.reflectY = function(d) {
    return arguments.length ? (f = d ? -1 : 1, Y()) : f < 0;
  }, M.precision = function(d) {
    return arguments.length ? (z = ue(N, L = d * d), T()) : nt(L);
  }, M.fitExtent = function(d, C) {
    return Ie(M, d, C);
  }, M.fitSize = function(d, C) {
    return bi(M, d, C);
  }, M.fitWidth = function(d, C) {
    return xi(M, d, C);
  }, M.fitHeight = function(d, C) {
    return Ni(M, d, C);
  };
  function Y() {
    var d = ce(i, 0, 0, c, f, a).apply(null, t(o, l)), C = ce(i, e - d[0], r - d[1], c, f, a);
    return s = ti(u, g, h), N = yn(t, C), b = yn(s, N), z = ue(N, L), T();
  }
  function T() {
    return x = I = null, M;
  }
  return function() {
    return t = n.apply(this, arguments), M.invert = t.invert && X, Y();
  };
}
function Oi(n) {
  return function(t, i) {
    var e = nt(t * t + i * i), r = n(e), o = P(r), l = R(r);
    return [
      tt(t * o, e * l),
      at(e && i * o / e)
    ];
  };
}
function _e(n, t) {
  return [R(t) * P(n), P(t)];
}
_e.invert = Oi(at);
function Wi() {
  return Ki(_e).scale(249.5).clipAngle(90 + A);
}
function Xi(n) {
  return n;
}
function Bi(n) {
  if (n == null) return Xi;
  var t, i, e = n.scale[0], r = n.scale[1], o = n.translate[0], l = n.translate[1];
  return function(u, g) {
    g || (t = i = 0);
    var h = 2, s = u.length, a = new Array(s);
    for (a[0] = (t += u[0]) * e + o, a[1] = (i += u[1]) * r + l; h < s; ) a[h] = u[h], ++h;
    return a;
  };
}
function Hi(n, t) {
  for (var i, e = n.length, r = e - t; r < --e; ) i = n[r], n[r++] = n[e], n[e] = i;
}
function ji(n, t) {
  return typeof t == "string" && (t = n.objects[t]), t.type === "GeometryCollection" ? { type: "FeatureCollection", features: t.geometries.map(function(i) {
    return fe(n, i);
  }) } : fe(n, t);
}
function fe(n, t) {
  var i = t.id, e = t.bbox, r = t.properties == null ? {} : t.properties, o = Ye(n, t);
  return i == null && e == null ? { type: "Feature", properties: r, geometry: o } : e == null ? { type: "Feature", id: i, properties: r, geometry: o } : { type: "Feature", id: i, bbox: e, properties: r, geometry: o };
}
function Ye(n, t) {
  var i = Bi(n.transform), e = n.arcs;
  function r(s, a) {
    a.length && a.pop();
    for (var c = e[s < 0 ? ~s : s], f = 0, p = c.length; f < p; ++f)
      a.push(i(c[f], f));
    s < 0 && Hi(a, p);
  }
  function o(s) {
    return i(s);
  }
  function l(s) {
    for (var a = [], c = 0, f = s.length; c < f; ++c) r(s[c], a);
    return a.length < 2 && a.push(a[0]), a;
  }
  function u(s) {
    for (var a = l(s); a.length < 4; ) a.push(a[0]);
    return a;
  }
  function g(s) {
    return s.map(u);
  }
  function h(s) {
    var a = s.type, c;
    switch (a) {
      case "GeometryCollection":
        return { type: a, geometries: s.geometries.map(h) };
      case "Point":
        c = o(s.coordinates);
        break;
      case "MultiPoint":
        c = s.coordinates.map(o);
        break;
      case "LineString":
        c = l(s.arcs);
        break;
      case "MultiLineString":
        c = s.arcs.map(l);
        break;
      case "Polygon":
        c = g(s.arcs);
        break;
      case "MultiPolygon":
        c = s.arcs.map(g);
        break;
      default:
        return null;
    }
    return { type: a, coordinates: c };
  }
  return h(t);
}
function Ui(n, t) {
  var i = {}, e = {}, r = {}, o = [], l = -1;
  t.forEach(function(h, s) {
    var a = n.arcs[h < 0 ? ~h : h], c;
    a.length < 3 && !a[1][0] && !a[1][1] && (c = t[++l], t[l] = h, t[s] = c);
  }), t.forEach(function(h) {
    var s = u(h), a = s[0], c = s[1], f, p;
    if (f = r[a])
      if (delete r[f.end], f.push(h), f.end = c, p = e[c]) {
        delete e[p.start];
        var E = p === f ? f : f.concat(p);
        e[E.start = f.start] = r[E.end = p.end] = E;
      } else
        e[f.start] = r[f.end] = f;
    else if (f = e[c])
      if (delete e[f.start], f.unshift(h), f.start = a, p = r[a]) {
        delete r[p.end];
        var m = p === f ? f : p.concat(f);
        e[m.start = p.start] = r[m.end = f.end] = m;
      } else
        e[f.start] = r[f.end] = f;
    else
      f = [h], e[f.start = a] = r[f.end = c] = f;
  });
  function u(h) {
    var s = n.arcs[h < 0 ? ~h : h], a = s[0], c;
    return n.transform ? (c = [0, 0], s.forEach(function(f) {
      c[0] += f[0], c[1] += f[1];
    })) : c = s[s.length - 1], h < 0 ? [c, a] : [a, c];
  }
  function g(h, s) {
    for (var a in h) {
      var c = h[a];
      delete s[c.start], delete c.start, delete c.end, c.forEach(function(f) {
        i[f < 0 ? ~f : f] = 1;
      }), o.push(c);
    }
  }
  return g(r, e), g(e, r), t.forEach(function(h) {
    i[h < 0 ? ~h : h] || o.push([h]);
  }), o;
}
function Zi(n) {
  return Ye(n, qi.apply(this, arguments));
}
function qi(n, t, i) {
  var e, r, o;
  if (arguments.length > 1) e = Vi(n, t, i);
  else for (r = 0, e = new Array(o = n.arcs.length); r < o; ++r) e[r] = r;
  return { type: "MultiLineString", arcs: Ui(n, e) };
}
function Vi(n, t, i) {
  var e = [], r = [], o;
  function l(a) {
    var c = a < 0 ? ~a : a;
    (r[c] || (r[c] = [])).push({ i: a, g: o });
  }
  function u(a) {
    a.forEach(l);
  }
  function g(a) {
    a.forEach(u);
  }
  function h(a) {
    a.forEach(g);
  }
  function s(a) {
    switch (o = a, a.type) {
      case "GeometryCollection":
        a.geometries.forEach(s);
        break;
      case "LineString":
        u(a.arcs);
        break;
      case "MultiLineString":
      case "Polygon":
        g(a.arcs);
        break;
      case "MultiPolygon":
        h(a.arcs);
        break;
    }
  }
  return s(t), r.forEach(i == null ? function(a) {
    e.push(a[0].i);
  } : function(a) {
    i(a[0].g, a[a.length - 1].g) && e.push(a[0].i);
  }), e;
}
const De = (n) => {
  const t = Math.round(n / 15);
  return `UTC${t >= 0 ? "+" : ""}${t}`;
};
async function Ji(n) {
  var t;
  try {
    const i = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(n)}&count=1&format=json`, e = await fetch(i).then((r) => r.json());
    if (e.results && e.results.length) {
      const r = e.results[0];
      return {
        lat: r.latitude,
        lon: r.longitude,
        cc: (r.country_code || "").toUpperCase(),
        label: [r.name, r.admin1, r.country].filter(Boolean).slice(0, 2).join(", "),
        tz: r.timezone
      };
    }
  } catch {
  }
  try {
    const i = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(n)}`, e = await fetch(i).then((r) => r.json());
    if (e && e.length) {
      const r = e[0], o = +r.lon;
      return {
        lat: +r.lat,
        lon: o,
        cc: (((t = r.address) == null ? void 0 : t.country_code) || "").toUpperCase(),
        label: (r.display_name || n).split(",").slice(0, 2).join(", "),
        tz: De(o),
        approxTz: !0
      };
    }
  } catch {
  }
  return null;
}
async function Qi(n, t) {
  var e;
  let i = "";
  try {
    const r = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&lat=${t}&lon=${n}`, o = await fetch(r).then((l) => l.json());
    i = (((e = o == null ? void 0 : o.address) == null ? void 0 : e.country_code) || "").toUpperCase();
  } catch {
  }
  return { cc: i, tz: De(n), approxTz: !0 };
}
const tr = {
  // Spanish
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  GQ: "es",
  // English
  US: "en",
  GB: "en",
  IE: "en",
  AU: "en",
  CA: "en",
  NZ: "en",
  IN: "en",
  ZA: "en",
  NG: "en",
  GH: "en",
  KE: "en",
  UG: "en",
  ZW: "en",
  JM: "en",
  TT: "en",
  SG: "en",
  PH: "en",
  MT: "en",
  PK: "en",
  BD: "en",
  // Portuguese
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  GW: "pt",
  ST: "pt",
  TL: "pt",
  // French
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  CI: "fr",
  SN: "fr",
  CM: "fr",
  CD: "fr",
  ML: "fr",
  NE: "fr",
  BF: "fr",
  TG: "fr",
  BJ: "fr",
  GA: "fr",
  CG: "fr",
  MG: "fr",
  // German
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  // Italian
  IT: "it",
  SM: "it",
  VA: "it",
  // Dutch
  NL: "nl",
  SR: "nl",
  // Nordic
  SE: "sv",
  NO: "no",
  DK: "da",
  FI: "fi",
  IS: "is",
  // Eastern Europe / Slavic
  RU: "ru",
  BY: "ru",
  PL: "pl",
  UA: "uk",
  CZ: "cs",
  SK: "sk",
  BG: "bg",
  RS: "sr",
  HR: "hr",
  SI: "sl",
  MK: "mk",
  BA: "bs",
  // Baltics / other Europe
  LT: "lt",
  LV: "lv",
  EE: "et",
  HU: "hu",
  RO: "ro",
  MD: "ro",
  GR: "el",
  CY: "el",
  AL: "sq",
  GE: "ka",
  AM: "hy",
  AZ: "az",
  // Middle East / Arabic
  SA: "ar",
  AE: "ar",
  EG: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  LY: "ar",
  IQ: "ar",
  JO: "ar",
  LB: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
  YE: "ar",
  SY: "ar",
  PS: "ar",
  SD: "ar",
  IL: "he",
  IR: "fa",
  TR: "tr",
  // South / Southeast / East Asia
  JP: "ja",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  KR: "ko",
  TH: "th",
  VN: "vi",
  ID: "id",
  MY: "ms",
  BN: "ms",
  KH: "km",
  LA: "lo",
  MM: "my",
  LK: "si",
  NP: "ne",
  // Africa (other)
  ET: "am",
  TZ: "sw",
  RW: "rw",
  SO: "so",
  // Central Asia
  KZ: "kk",
  UZ: "uz",
  KG: "ky",
  TJ: "tg",
  TM: "tk",
  MN: "mn"
};
function he(n) {
  return n && tr[n.toUpperCase()] || "en";
}
const rt = (n, t, i) => n < t ? t : n > i ? i : n, nr = (n) => n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2, er = (n) => 1 - (1 - n) * (1 - n), ir = (n, t) => ((t - n) % 360 + 540) % 360 - 180, rr = (n) => `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${n}.json`;
class Ke {
  constructor(t, i = {}) {
    this.listeners = [], this.W = 0, this.H = 0, this.DPR = 1, this.cx = 0, this.cy = 0, this.baseR = 0, this.R = 0, this.stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      p: Math.random() * 6
    })), this.countriesFC = null, this.bordersMesh = null, this.graticule = yi(), this.lastProjection = null, this.hoverFeat = null, this.selectedFeat = null, this.mode = "idle", this.lon0 = 20, this.lat0 = 25, this.fromLon = 0, this.fromLat = 0, this.toLon = 0, this.toLat = 0, this.t0 = 0, this.zStart = 1, this.zTarget = 2.6, this.zFrom = 1, this.dragging = !1, this.vlon = 0.12, this.vlat = 0, this.zoomK = 1, this.reduceMotion = !1, this.detected = null, this.raf = 0, this.lastX = 0, this.lastY = 0, this.moved = 0, this.target = t, this.opts = {
      accent: i.accent ?? "#f6a13c",
      search: i.search ?? !0,
      autoSpin: i.autoSpin ?? !0,
      resolution: i.resolution ?? "110m",
      ...i
    }, this.reduceMotion = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, this.autoSpin = this.reduceMotion ? !1 : this.opts.autoSpin, getComputedStyle(t).position === "static" && (t.style.position = "relative"), t.style.overflow = "hidden", this.cv = document.createElement("canvas"), this.cv.tabIndex = 0, this.cv.setAttribute("role", "application"), this.cv.setAttribute("aria-label", "Interactive globe. Arrow keys rotate, plus and minus zoom, Enter selects the country at the centre. Or use the search box below."), Object.assign(this.cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }), t.appendChild(this.cv), this.ctx = this.cv.getContext("2d"), this.opts.search && this.buildSearch(), this.buildWatermark(), this.bindEvents(), this.loadData(), this.resize(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(t), this.raf = requestAnimationFrame((e) => this.loop(e));
  }
  /** Register a listener fired whenever a place is picked. */
  on(t, i) {
    return this.listeners.push(i), this;
  }
  /** Fly to coordinates and pick them. */
  flyTo(t, i) {
    this.fromLon = this.lon0, this.fromLat = this.lat0, this.toLon = t, this.toLat = i, this.zFrom = this.zoomK, this.selectedFeat = null, this.t0 = performance.now(), this.mode = "travel";
  }
  /** Search by postal code / city / country and fly to the result. */
  async search(t) {
    const i = t.trim();
    if (!i) return;
    const e = await Ji(i);
    e && (this.detected = { lat: e.lat, lon: e.lon, country: e.cc, timezone: e.tz, language: he(e.cc), label: e.label, approxTimezone: e.approxTz }, this.flyTo(e.lon, e.lat));
  }
  /** Stop everything and remove the DOM it created. */
  destroy() {
    var t, i, e, r;
    cancelAnimationFrame(this.raf), (t = this.ro) == null || t.disconnect(), this.cv.remove(), (e = (i = this.input) == null ? void 0 : i.parentElement) == null || e.remove(), (r = this.wm) == null || r.remove(), this.listeners = [];
  }
  // ---- internals ----
  emit() {
    var i, e;
    if (!this.detected) return;
    const t = this.detected;
    for (const r of this.listeners) r(t);
    this.target.dispatchEvent(new CustomEvent("locale", { detail: t, bubbles: !0 })), (e = (i = this.opts).onLocale) == null || e.call(i, t);
  }
  buildSearch() {
    const t = document.createElement("div");
    Object.assign(t.style, { position: "absolute", left: "50%", bottom: "7%", transform: "translateX(-50%)", zIndex: "5", display: "flex", gap: "8px", width: "min(440px,90%)", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "14px", padding: "7px 7px 7px 14px", backdropFilter: "blur(8px)" });
    const i = document.createElement("input");
    i.placeholder = this.opts.placeholder ?? "Postal code, city or country…", i.setAttribute("aria-label", "Search by postal code, city or country"), i.type = "search", i.autocomplete = "off", Object.assign(i.style, { flex: "1", background: "none", border: "0", outline: "0", color: "#eef2fb", fontSize: "1rem", minWidth: "0", fontFamily: "inherit" });
    const e = document.createElement("button");
    e.type = "button", e.textContent = "Locate", e.setAttribute("aria-label", "Locate and select this place"), Object.assign(e.style, { border: "0", cursor: "pointer", borderRadius: "10px", padding: "9px 16px", fontWeight: "600", background: this.opts.accent, color: "#231400", fontFamily: "inherit" });
    const r = () => this.search(i.value);
    e.addEventListener("click", r), i.addEventListener("keydown", (o) => {
      o.key === "Enter" && r();
    }), t.append(i, e), this.target.appendChild(t), this.input = i;
  }
  // Attribution required by the license (AGPLv3 §7b). Please keep it.
  buildWatermark() {
    const t = document.createElement("a");
    t.href = "https://ricajos.com", t.target = "_blank", t.rel = "noopener", t.textContent = "PlanetLogin · by Ricajos", Object.assign(t.style, { position: "absolute", left: "14px", bottom: "12px", zIndex: "20", fontSize: "12px", letterSpacing: ".3px", color: "rgba(154,167,189,.85)", textDecoration: "none", fontFamily: "inherit" }), this.target.appendChild(t), this.wm = t;
  }
  async loadData() {
    try {
      const t = this.opts.dataUrl ?? rr(this.opts.resolution), i = await fetch(t).then((e) => e.json());
      this.countriesFC = ji(i, i.objects.countries), this.bordersMesh = Zi(i, i.objects.countries, (e, r) => e !== r);
    } catch (t) {
      console.warn("[planetlogin] country data failed to load", t);
    }
  }
  resize() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2), this.W = this.target.clientWidth, this.H = this.target.clientHeight, this.cv.width = this.W * this.DPR, this.cv.height = this.H * this.DPR, this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0), this.cx = this.W / 2, this.cy = this.H / 2, this.baseR = Math.min(this.W, this.H) * 0.34, this.mode === "idle" && (this.R = this.baseR * this.zoomK);
  }
  featureCenter(t) {
    const i = t.geometry;
    if (i.type === "Polygon") return On(t);
    let e = null, r = -1;
    for (const o of i.coordinates) {
      const l = { type: "Polygon", coordinates: o }, u = Ue(l);
      u > r && (r = u, e = l);
    }
    return On(e || t);
  }
  countryAt(t, i) {
    var o, l;
    if (!this.countriesFC || !this.lastProjection) return null;
    const e = this.cv.getBoundingClientRect(), r = (l = (o = this.lastProjection).invert) == null ? void 0 : l.call(o, [t - e.left, i - e.top]);
    if (!r || isNaN(r[0])) return null;
    for (const u of this.countriesFC.features) if (rn(u, r)) return u;
    return null;
  }
  /** The country under the globe's centre point (current rotation). */
  countryAtCenter() {
    if (!this.countriesFC) return null;
    for (const t of this.countriesFC.features) if (rn(t, [this.lon0, this.lat0])) return t;
    return null;
  }
  async pickFeature(t) {
    var o;
    const [i, e] = this.featureCenter(t);
    this.flyTo(i, e);
    const r = await Qi(i, e);
    this.detected = { lat: e, lon: i, country: r.cc, timezone: r.tz, language: he(r.cc), label: ((o = t.properties) == null ? void 0 : o.name) ?? "", approxTimezone: r.approxTz };
  }
  onLocated() {
    this.detected && (this.autoSpin = !1, this.selectedFeat = this.countriesFC && this.countriesFC.features.find((t) => rn(t, [this.detected.lon, this.detected.lat])) || null, this.emit());
  }
  bindEvents() {
    const t = this.cv;
    t.addEventListener("pointerdown", (e) => {
      this.mode !== "idle" && (this.mode = "idle", this.autoSpin = !1), this.dragging = !0, this.moved = 0, this.lastX = e.clientX, this.lastY = e.clientY, this.vlon = 0, this.vlat = 0, t.style.cursor = "grabbing", t.setPointerCapture(e.pointerId);
    }), t.addEventListener("pointermove", (e) => {
      if (this.dragging) {
        const r = e.clientX - this.lastX, o = e.clientY - this.lastY;
        this.lastX = e.clientX, this.lastY = e.clientY, this.moved += Math.abs(r) + Math.abs(o);
        const l = 0.26 / this.zoomK;
        this.lon0 += -r * l, this.lat0 = rt(this.lat0 + o * l, -82, 82), this.vlon = rt(-r * l, -8, 8), this.vlat = rt(o * l, -8, 8);
      } else this.mode === "idle" && (this.hoverFeat = this.countryAt(e.clientX, e.clientY), t.style.cursor = this.hoverFeat ? "pointer" : "grab");
    });
    const i = (e) => {
      if (this.dragging) {
        this.dragging = !1, t.style.cursor = "grab";
        try {
          t.releasePointerCapture(e.pointerId);
        } catch {
        }
      }
    };
    t.addEventListener("pointerup", (e) => {
      const r = this.dragging && this.moved < 6;
      if (i(e), r && this.mode === "idle") {
        const o = this.countryAt(e.clientX, e.clientY);
        o && (this.hoverFeat = null, this.pickFeature(o));
      }
    }), t.addEventListener("pointercancel", i), t.addEventListener("pointerleave", (e) => {
      i(e), this.hoverFeat = null;
    }), t.addEventListener("wheel", (e) => {
      e.preventDefault(), this.mode !== "idle" && (this.mode = "idle", this.autoSpin = !1), this.zoomK = rt(this.zoomK * Math.exp(-e.deltaY * 12e-4), 0.7, 9), this.R = this.baseR * this.zoomK, this.hoverFeat = this.countryAt(e.clientX, e.clientY);
    }, { passive: !1 }), t.addEventListener("focus", () => {
      t.style.outline = `2px solid ${this.opts.accent}`, t.style.outlineOffset = "-2px";
    }), t.addEventListener("blur", () => {
      t.style.outline = "none", this.hoverFeat = null;
    }), t.addEventListener("keydown", (e) => {
      const r = 6 / this.zoomK;
      let o = !0;
      switch (e.key) {
        case "ArrowLeft":
          this.lon0 -= r;
          break;
        case "ArrowRight":
          this.lon0 += r;
          break;
        case "ArrowUp":
          this.lat0 = rt(this.lat0 + r, -82, 82);
          break;
        case "ArrowDown":
          this.lat0 = rt(this.lat0 - r, -82, 82);
          break;
        case "+":
        case "=":
          this.zoomK = rt(this.zoomK * 1.15, 0.7, 9), this.R = this.baseR * this.zoomK;
          break;
        case "-":
        case "_":
          this.zoomK = rt(this.zoomK / 1.15, 0.7, 9), this.R = this.baseR * this.zoomK;
          break;
        case "Enter":
        case " ": {
          const l = this.countryAtCenter();
          l && (this.hoverFeat = null, this.pickFeature(l));
          break;
        }
        default:
          o = !1;
      }
      o && (e.preventDefault(), this.autoSpin = !1, this.mode !== "idle" && (this.mode = "idle"), e.key !== "Enter" && e.key !== " " && (this.hoverFeat = this.countryAtCenter()));
    });
  }
  loop(t) {
    if (this.mode === "idle")
      this.dragging || (this.vlon += ((this.autoSpin ? 0.12 : 0) - this.vlon) * (this.autoSpin ? 0.035 : 0.08), this.vlat += (0 - this.vlat) * 0.06, this.lon0 += this.vlon, this.lat0 = rt(this.lat0 + this.vlat, -82, 82));
    else if (this.mode === "travel") {
      const i = Math.min(1, (t - this.t0) / (this.reduceMotion ? 120 : 1100)), e = nr(i);
      this.lon0 = this.fromLon + ir(this.fromLon, this.toLon) * e, this.lat0 = this.fromLat + (this.toLat - this.fromLat) * e, this.zoomK = this.zFrom + (1 - this.zFrom) * e, this.R = this.baseR * this.zoomK, i >= 1 && (this.mode = "zoom", this.t0 = t, this.zStart = 1, this.zTarget = 2.6);
    } else {
      const i = Math.min(1, (t - this.t0) / (this.reduceMotion ? 100 : 750)), e = er(i);
      this.zoomK = this.zStart + (this.zTarget - this.zStart) * e, this.R = this.baseR * this.zoomK, this.lon0 = this.toLon, this.lat0 = this.toLat, i >= 1 && (this.mode = "idle", this.onLocated());
    }
    this.draw(t), this.raf = requestAnimationFrame((i) => this.loop(i));
  }
  draw(t) {
    const { ctx: i, cx: e, cy: r, R: o, W: l, H: u } = this;
    i.clearRect(0, 0, l, u), i.fillStyle = "#070b16", i.fillRect(0, 0, l, u);
    for (const c of this.stars) {
      const f = 0.6 + 0.4 * Math.sin(t / 700 + c.p);
      i.globalAlpha = c.a * f, i.fillStyle = "#cdd8f0", i.beginPath(), i.arc(c.x * l, c.y * u, c.r, 0, 7), i.fill();
    }
    i.globalAlpha = 1;
    const g = i.createRadialGradient(e, r, o * 0.9, e, r, o * 1.25);
    g.addColorStop(0, "rgba(120,170,255,.18)"), g.addColorStop(1, "rgba(120,170,255,0)"), i.fillStyle = g, i.beginPath(), i.arc(e, r, o * 1.25, 0, 7), i.fill(), i.save(), i.beginPath(), i.arc(e, r, o, 0, 7), i.clip();
    const h = i.createRadialGradient(e - o * 0.3, r - o * 0.35, o * 0.1, e, r, o);
    h.addColorStop(0, "#2a5e90"), h.addColorStop(1, "#0c2138"), i.fillStyle = h, i.fillRect(e - o, r - o, 2 * o, 2 * o);
    const s = Wi().translate([e, r]).scale(o).clipAngle(90).rotate([-this.lon0, -this.lat0]);
    this.lastProjection = s;
    const a = Fi(s, i);
    i.beginPath(), a(this.graticule), i.strokeStyle = "rgba(255,255,255,.07)", i.lineWidth = 1, i.stroke(), this.countriesFC && (i.beginPath(), a(this.countriesFC), i.fillStyle = "rgba(70,160,116,.92)", i.fill()), this.selectedFeat && (i.beginPath(), a(this.selectedFeat), i.fillStyle = this.hexA(this.opts.accent, 0.7), i.fill(), i.strokeStyle = this.opts.accent, i.lineWidth = 1.4, i.stroke()), this.hoverFeat && this.hoverFeat !== this.selectedFeat && (i.beginPath(), a(this.hoverFeat), i.fillStyle = this.hexA(this.opts.accent, 0.5), i.fill()), this.bordersMesh && (i.beginPath(), a(this.bordersMesh), i.strokeStyle = "rgba(10,28,48,.85)", i.lineWidth = 0.6, i.stroke()), i.restore(), i.strokeStyle = "rgba(150,200,255,.25)", i.lineWidth = 1.5, i.beginPath(), i.arc(e, r, o, 0, 7), i.stroke();
  }
  hexA(t, i) {
    const e = t.replace("#", ""), r = e.length === 3 ? e.split("").map((g) => g + g).join("") : e, o = parseInt(r.slice(0, 2), 16), l = parseInt(r.slice(2, 4), 16), u = parseInt(r.slice(4, 6), 16);
    return `rgba(${o},${l},${u},${i})`;
  }
}
class or extends HTMLElement {
  static get observedAttributes() {
    return ["accent", "resolution", "search", "placeholder"];
  }
  connectedCallback() {
    getComputedStyle(this).display === "inline" && (this.style.display = "block");
    const t = {
      accent: this.getAttribute("accent") ?? void 0,
      resolution: this.getAttribute("resolution") ?? void 0,
      placeholder: this.getAttribute("placeholder") ?? void 0,
      search: this.getAttribute("search") !== "false",
      autoSpin: this.getAttribute("autospin") !== "false"
    };
    this.instance = new Ke(this, t);
  }
  disconnectedCallback() {
    var t;
    (t = this.instance) == null || t.destroy(), this.instance = void 0;
  }
}
function sr(n, t) {
  return new Ke(n, t);
}
typeof customElements < "u" && !customElements.get("planet-login") && customElements.define("planet-login", or);
export {
  Ke as PlanetLogin,
  or as PlanetLoginElement,
  sr as createPlanetLogin
};
