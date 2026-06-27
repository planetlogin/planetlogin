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
function de(n) {
  return Array.from(Ge(n));
}
function ft(n, t, i) {
  n = +n, t = +t, i = (r = arguments.length) < 2 ? (t = n, n = 0, 1) : r < 3 ? 1 : +i;
  for (var e = -1, r = Math.max(0, Math.ceil((t - n) / i)) | 0, o = new Array(r); ++e < r; )
    o[e] = n + e * i;
  return o;
}
var z = 1e-6, _t = 1e-12, $ = Math.PI, Z = $ / 2, Kt = $ / 4, B = $ * 2, q = 180 / $, b = $ / 180, k = Math.abs, We = Math.atan, tt = Math.atan2, L = Math.cos, $t = Math.ceil, ln = Math.hypot, P = Math.sin, Xe = Math.sign || function(n) {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}, nt = Math.sqrt;
function Ue(n) {
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
var Kn = {
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
    un(n.coordinates, t, 0);
  },
  MultiLineString: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) un(i[e], t, 0);
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
function un(n, t, i) {
  var e = -1, r = n.length - i, o;
  for (t.lineStart(); ++e < r; ) o = n[e], t.point(o[0], o[1], o[2]);
  t.lineEnd();
}
function Dn(n, t) {
  var i = -1, e = n.length;
  for (t.polygonStart(); ++i < e; ) un(n[i], t, 1);
  t.polygonEnd();
}
function ot(n, t) {
  n && Kn.hasOwnProperty(n.type) ? Kn[n.type](n, t) : Yt(n, t);
}
var cn = new W(), Dt = new W(), ge, ve, fn, hn, pn, Lt = {
  point: _,
  lineStart: _,
  lineEnd: _,
  polygonStart: function() {
    cn = new W(), Lt.lineStart = Be, Lt.lineEnd = He;
  },
  polygonEnd: function() {
    var n = +cn;
    Dt.add(n < 0 ? B + n : n), this.lineStart = this.lineEnd = this.point = _;
  },
  sphere: function() {
    Dt.add(B);
  }
};
function Be() {
  Lt.point = je;
}
function He() {
  ye(ge, ve);
}
function je(n, t) {
  Lt.point = ye, ge = n, ve = t, n *= b, t *= b, fn = n, hn = L(t = t / 2 + Kt), pn = P(t);
}
function ye(n, t) {
  n *= b, t *= b, t = t / 2 + Kt;
  var i = n - fn, e = i >= 0 ? 1 : -1, r = e * i, o = L(t), l = P(t), u = pn * l, g = hn * o + u * L(r), h = u * e * P(r);
  cn.add(tt(h, g)), fn = n, hn = o, pn = l;
}
function Ze(n) {
  return Dt = new W(), ot(n, Lt), Dt * 2;
}
function dn(n) {
  return [tt(n[1], n[0]), at(n[2])];
}
function dt(n) {
  var t = n[0], i = n[1], e = L(i);
  return [e * L(t), e * P(t), P(i)];
}
function bt(n, t) {
  return n[0] * t[0] + n[1] * t[1] + n[2] * t[2];
}
function Ot(n, t) {
  return [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
}
function en(n, t) {
  n[0] += t[0], n[1] += t[1], n[2] += t[2];
}
function Ft(n, t) {
  return [n[0] * t, n[1] * t, n[2] * t];
}
function gn(n) {
  var t = nt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  n[0] /= t, n[1] /= t, n[2] /= t;
}
var mt, Gt, Wt, Xt, Ut, Bt, Ht, jt, vn, yn, mn, me, Se, D, O, G, J = {
  sphere: _,
  point: kn,
  lineStart: On,
  lineEnd: Gn,
  polygonStart: function() {
    J.lineStart = Ve, J.lineEnd = Qe;
  },
  polygonEnd: function() {
    J.lineStart = On, J.lineEnd = Gn;
  }
};
function kn(n, t) {
  n *= b, t *= b;
  var i = L(t);
  zt(i * L(n), i * P(n), P(t));
}
function zt(n, t, i) {
  ++mt, Wt += (n - Wt) / mt, Xt += (t - Xt) / mt, Ut += (i - Ut) / mt;
}
function On() {
  J.point = qe;
}
function qe(n, t) {
  n *= b, t *= b;
  var i = L(t);
  D = i * L(n), O = i * P(n), G = P(t), J.point = Je, zt(D, O, G);
}
function Je(n, t) {
  n *= b, t *= b;
  var i = L(t), e = i * L(n), r = i * P(n), o = P(t), l = tt(nt((l = O * o - G * r) * l + (l = G * e - D * o) * l + (l = D * r - O * e) * l), D * e + O * r + G * o);
  Gt += l, Bt += l * (D + (D = e)), Ht += l * (O + (O = r)), jt += l * (G + (G = o)), zt(D, O, G);
}
function Gn() {
  J.point = kn;
}
function Ve() {
  J.point = ti;
}
function Qe() {
  Ee(me, Se), J.point = kn;
}
function ti(n, t) {
  me = n, Se = t, n *= b, t *= b, J.point = Ee;
  var i = L(t);
  D = i * L(n), O = i * P(n), G = P(t), zt(D, O, G);
}
function Ee(n, t) {
  n *= b, t *= b;
  var i = L(t), e = i * L(n), r = i * P(n), o = P(t), l = O * o - G * r, u = G * e - D * o, g = D * r - O * e, h = ln(l, u, g), s = at(h), a = h && -s / h;
  vn.add(a * l), yn.add(a * u), mn.add(a * g), Gt += s, Bt += s * (D + (D = e)), Ht += s * (O + (O = r)), jt += s * (G + (G = o)), zt(D, O, G);
}
function Wn(n) {
  mt = Gt = Wt = Xt = Ut = Bt = Ht = jt = 0, vn = new W(), yn = new W(), mn = new W(), ot(n, J);
  var t = +vn, i = +yn, e = +mn, r = ln(t, i, e);
  return r < _t && (t = Bt, i = Ht, e = jt, Gt < z && (t = Wt, i = Xt, e = Ut), r = ln(t, i, e), r < _t) ? [NaN, NaN] : [tt(i, t) * q, at(e / r) * q];
}
function Sn(n, t) {
  function i(e, r) {
    return e = n(e, r), t(e[0], e[1]);
  }
  return n.invert && t.invert && (i.invert = function(e, r) {
    return e = t.invert(e, r), e && n.invert(e[0], e[1]);
  }), i;
}
function En(n, t) {
  return k(n) > $ && (n -= Math.round(n / B) * B), [n, t];
}
En.invert = En;
function ni(n, t, i) {
  return (n %= B) ? t || i ? Sn(Un(n), Bn(t, i)) : Un(n) : t || i ? Bn(t, i) : En;
}
function Xn(n) {
  return function(t, i) {
    return t += n, k(t) > $ && (t -= Math.round(t / B) * B), [t, i];
  };
}
function Un(n) {
  var t = Xn(n);
  return t.invert = Xn(-n), t;
}
function Bn(n, t) {
  var i = L(n), e = P(n), r = L(t), o = P(t);
  function l(u, g) {
    var h = L(g), s = L(u) * h, a = P(u) * h, c = P(g), f = c * i + s * e;
    return [
      tt(a * r - f * o, s * i - c * e),
      at(f * r + a * o)
    ];
  }
  return l.invert = function(u, g) {
    var h = L(g), s = L(u) * h, a = P(u) * h, c = P(g), f = c * r - a * o;
    return [
      tt(a * r + c * o, s * i + f * e),
      at(f * i - s * e)
    ];
  }, l;
}
function ei(n, t, i, e, r, o) {
  if (i) {
    var l = L(t), u = P(t), g = e * i;
    r == null ? (r = t + e * B, o = t - g / 2) : (r = Hn(l, r), o = Hn(l, o), (e > 0 ? r < o : r > o) && (r += e * B));
    for (var h, s = r; e > 0 ? s > o : s < o; s -= g)
      h = dn([l, -u * L(s), -u * P(s)]), n.point(h[0], h[1]);
  }
}
function Hn(n, t) {
  t = dt(t), t[0] -= n, gn(t);
  var i = Ue(-t[1]);
  return ((-t[2] < 0 ? -i : i) + B - z) % B;
}
function we() {
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
  return k(n[0] - t[0]) < z && k(n[1] - t[1]) < z;
}
function xt(n, t, i, e) {
  this.x = n, this.z = t, this.o = i, this.e = e, this.v = !1, this.n = this.p = null;
}
function Me(n, t, i, e, r) {
  var o = [], l = [], u, g;
  if (n.forEach(function(p) {
    if (!((E = p.length - 1) <= 0)) {
      var E, y = p[0], m = p[E], w;
      if (Nt(y, m)) {
        if (!y[2] && !m[2]) {
          for (r.lineStart(), u = 0; u < E; ++u) r.point((y = p[u])[0], y[1]);
          r.lineEnd();
          return;
        }
        m[0] += 2 * z;
      }
      o.push(w = new xt(y, p, null, !0)), l.push(w.o = new xt(y, null, w, !1)), o.push(w = new xt(m, p, null, !1)), l.push(w.o = new xt(m, null, w, !0));
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
function rn(n) {
  return k(n[0]) <= $ ? n[0] : Xe(n[0]) * ((k(n[0]) + $) % B - $);
}
function Pe(n, t) {
  var i = rn(t), e = t[1], r = P(e), o = [P(i), -L(i), 0], l = 0, u = 0, g = new W();
  r === 1 ? e = Z + z : r === -1 && (e = -Z - z);
  for (var h = 0, s = n.length; h < s; ++h)
    if (c = (a = n[h]).length)
      for (var a, c, f = a[c - 1], p = rn(f), E = f[1] / 2 + Kt, y = P(E), m = L(E), w = 0; w < c; ++w, p = S, y = A, m = T, f = v) {
        var v = a[w], S = rn(v), R = v[1] / 2 + Kt, A = P(R), T = L(R), F = S - p, x = F >= 0 ? 1 : -1, I = x * F, M = I > $, X = y * A;
        if (g.add(tt(X * x * P(I), m * T + X * L(I))), l += M ? F + x * B : F, M ^ p >= i ^ S >= i) {
          var K = Ot(dt(f), dt(v));
          gn(K);
          var N = Ot(o, K);
          gn(N);
          var d = (M ^ F >= 0 ? -1 : 1) * at(N[2]);
          (e > d || e === d && (K[0] || K[1])) && (u += M ^ F >= 0 ? 1 : -1);
        }
      }
  return (l < -z || l < z && g < -_t) ^ u & 1;
}
function Le(n, t, i, e) {
  return function(r) {
    var o = t(r), l = we(), u = t(l), g = !1, h, s, a, c = {
      point: f,
      lineStart: E,
      lineEnd: y,
      polygonStart: function() {
        c.point = m, c.lineStart = w, c.lineEnd = v, s = [], h = [];
      },
      polygonEnd: function() {
        c.point = f, c.lineStart = E, c.lineEnd = y, s = de(s);
        var S = Pe(h, e);
        s.length ? (g || (r.polygonStart(), g = !0), Me(s, ri, S, i, r)) : S && (g || (r.polygonStart(), g = !0), r.lineStart(), i(null, null, 1, r), r.lineEnd()), g && (r.polygonEnd(), g = !1), s = h = null;
      },
      sphere: function() {
        r.polygonStart(), r.lineStart(), i(null, null, 1, r), r.lineEnd(), r.polygonEnd();
      }
    };
    function f(S, R) {
      n(S, R) && r.point(S, R);
    }
    function p(S, R) {
      o.point(S, R);
    }
    function E() {
      c.point = p, o.lineStart();
    }
    function y() {
      c.point = f, o.lineEnd();
    }
    function m(S, R) {
      a.push([S, R]), u.point(S, R);
    }
    function w() {
      u.lineStart(), a = [];
    }
    function v() {
      m(a[0][0], a[0][1]), u.lineEnd();
      var S = u.clean(), R = l.result(), A, T = R.length, F, x, I;
      if (a.pop(), h.push(a), a = null, !!T) {
        if (S & 1) {
          if (x = R[0], (F = x.length - 1) > 0) {
            for (g || (r.polygonStart(), g = !0), r.lineStart(), A = 0; A < F; ++A) r.point((I = x[A])[0], I[1]);
            r.lineEnd();
          }
          return;
        }
        T > 1 && S & 2 && R.push(R.pop().concat(R.shift())), s.push(R.filter(ii));
      }
    }
    return c;
  };
}
function ii(n) {
  return n.length > 1;
}
function ri(n, t) {
  return ((n = n.x)[0] < 0 ? n[1] - Z - z : Z - n[1]) - ((t = t.x)[0] < 0 ? t[1] - Z - z : Z - t[1]);
}
const Zn = Le(
  function() {
    return !0;
  },
  oi,
  ai,
  [-$, -Z]
);
function oi(n) {
  var t = NaN, i = NaN, e = NaN, r;
  return {
    lineStart: function() {
      n.lineStart(), r = 1;
    },
    point: function(o, l) {
      var u = o > 0 ? $ : -$, g = k(o - t);
      k(g - $) < z ? (n.point(t, i = (i + l) / 2 > 0 ? Z : -Z), n.point(e, i), n.lineEnd(), n.lineStart(), n.point(u, i), n.point(o, i), r = 0) : e !== u && g >= $ && (k(t - e) < z && (t -= e * z), k(o - u) < z && (o -= u * z), i = si(t, i, o, l), n.point(e, i), n.lineEnd(), n.lineStart(), n.point(u, i), r = 0), n.point(t = o, i = l), e = u;
    },
    lineEnd: function() {
      n.lineEnd(), t = i = NaN;
    },
    clean: function() {
      return 2 - r;
    }
  };
}
function si(n, t, i, e) {
  var r, o, l = P(n - i);
  return k(l) > z ? We((P(t) * (o = L(e)) * P(i) - P(e) * (r = L(t)) * P(n)) / (r * o * l)) : (t + e) / 2;
}
function ai(n, t, i, e) {
  var r;
  if (n == null)
    r = i * Z, e.point(-$, r), e.point(0, r), e.point($, r), e.point($, 0), e.point($, -r), e.point(0, -r), e.point(-$, -r), e.point(-$, 0), e.point(-$, r);
  else if (k(n[0] - t[0]) > z) {
    var o = n[0] < t[0] ? $ : -$;
    r = i * o / 2, e.point(-o, r), e.point(0, r), e.point(o, r);
  } else
    e.point(t[0], t[1]);
}
function li(n) {
  var t = L(n), i = 2 * b, e = t > 0, r = k(t) > z;
  function o(s, a, c, f) {
    ei(f, n, i, c, s, a);
  }
  function l(s, a) {
    return L(s) * L(a) > t;
  }
  function u(s) {
    var a, c, f, p, E;
    return {
      lineStart: function() {
        p = f = !1, E = 1;
      },
      point: function(y, m) {
        var w = [y, m], v, S = l(y, m), R = e ? S ? 0 : h(y, m) : S ? h(y + (y < 0 ? $ : -$), m) : 0;
        if (!a && (p = f = S) && s.lineStart(), S !== f && (v = g(a, w), (!v || Nt(a, v) || Nt(w, v)) && (w[2] = 1)), S !== f)
          E = 0, S ? (s.lineStart(), v = g(w, a), s.point(v[0], v[1])) : (v = g(a, w), s.point(v[0], v[1], 2), s.lineEnd()), a = v;
        else if (r && a && e ^ S) {
          var A;
          !(R & c) && (A = g(w, a, !0)) && (E = 0, e ? (s.lineStart(), s.point(A[0][0], A[0][1]), s.point(A[1][0], A[1][1]), s.lineEnd()) : (s.point(A[1][0], A[1][1]), s.lineEnd(), s.lineStart(), s.point(A[0][0], A[0][1], 3)));
        }
        S && (!a || !Nt(a, w)) && s.point(w[0], w[1]), a = w, f = S, c = R;
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
    var f = dt(s), p = dt(a), E = [1, 0, 0], y = Ot(f, p), m = bt(y, y), w = y[0], v = m - w * w;
    if (!v) return !c && s;
    var S = t * m / v, R = -t * w / v, A = Ot(E, y), T = Ft(E, S), F = Ft(y, R);
    en(T, F);
    var x = A, I = bt(T, x), M = bt(x, x), X = I * I - M * (bt(T, T) - 1);
    if (!(X < 0)) {
      var K = nt(X), N = Ft(x, (-I - K) / M);
      if (en(N, T), N = dn(N), !c) return N;
      var d = s[0], C = a[0], Y = s[1], U = a[1], H;
      C < d && (H = d, d = C, C = H);
      var yt = C - d, et = k(yt - $) < z, lt = et || yt < z;
      if (!et && U < Y && (H = Y, Y = U, U = H), lt ? et ? Y + U > 0 ^ N[1] < (k(N[0] - d) < z ? Y : U) : Y <= N[1] && N[1] <= U : yt > $ ^ (d <= N[0] && N[0] <= C)) {
        var it = Ft(x, (-I + K) / M);
        return en(it, T), [N, dn(it)];
      }
    }
  }
  function h(s, a) {
    var c = e ? n : $ - n, f = 0;
    return s < -c ? f |= 1 : s > c && (f |= 2), a < -c ? f |= 4 : a > c && (f |= 8), f;
  }
  return Le(l, u, o, e ? [0, -n] : [-$, n - $]);
}
function ui(n, t, i, e, r, o) {
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
var St = 1e9, Tt = -St;
function ci(n, t, i, e) {
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
    return k(h[0] - n) < z ? s > 0 ? 0 : 3 : k(h[0] - i) < z ? s > 0 ? 2 : 1 : k(h[1] - t) < z ? s > 0 ? 1 : 0 : s > 0 ? 3 : 2;
  }
  function u(h, s) {
    return g(h.x, s.x);
  }
  function g(h, s) {
    var a = l(h, 1), c = l(s, 1);
    return a !== c ? a - c : a === 0 ? s[1] - h[1] : a === 1 ? h[0] - s[0] : a === 2 ? h[1] - s[1] : s[0] - h[0];
  }
  return function(h) {
    var s = h, a = we(), c, f, p, E, y, m, w, v, S, R, A, T = {
      point: F,
      lineStart: X,
      lineEnd: K,
      polygonStart: I,
      polygonEnd: M
    };
    function F(d, C) {
      r(d, C) && s.point(d, C);
    }
    function x() {
      for (var d = 0, C = 0, Y = f.length; C < Y; ++C)
        for (var U = f[C], H = 1, yt = U.length, et = U[0], lt, it, Ct = et[0], ct = et[1]; H < yt; ++H)
          lt = Ct, it = ct, et = U[H], Ct = et[0], ct = et[1], it <= e ? ct > e && (Ct - lt) * (e - it) > (ct - it) * (n - lt) && ++d : ct <= e && (Ct - lt) * (e - it) < (ct - it) * (n - lt) && --d;
      return d;
    }
    function I() {
      s = a, c = [], f = [], A = !0;
    }
    function M() {
      var d = x(), C = A && d, Y = (c = de(c)).length;
      (C || Y) && (h.polygonStart(), C && (h.lineStart(), o(null, null, 1, h), h.lineEnd()), Y && Me(c, u, d, o, h), h.polygonEnd()), s = h, c = f = p = null;
    }
    function X() {
      T.point = N, f && f.push(p = []), R = !0, S = !1, w = v = NaN;
    }
    function K() {
      c && (N(E, y), m && S && a.rejoin(), c.push(a.result())), T.point = F, S && s.lineEnd();
    }
    function N(d, C) {
      var Y = r(d, C);
      if (f && p.push([d, C]), R)
        E = d, y = C, m = Y, R = !1, Y && (s.lineStart(), s.point(d, C));
      else if (Y && S) s.point(d, C);
      else {
        var U = [w = Math.max(Tt, Math.min(St, w)), v = Math.max(Tt, Math.min(St, v))], H = [d = Math.max(Tt, Math.min(St, d)), C = Math.max(Tt, Math.min(St, C))];
        ui(U, H, n, t, i, e) ? (S || (s.lineStart(), s.point(U[0], U[1])), s.point(H[0], H[1]), Y || s.lineEnd(), A = !1) : Y && (s.lineStart(), s.point(d, C), A = !1);
      }
      w = d, v = C, S = Y;
    }
    return T;
  };
}
var wn, Mn, kt, It, gt = {
  sphere: _,
  point: _,
  lineStart: fi,
  lineEnd: _,
  polygonStart: _,
  polygonEnd: _
};
function fi() {
  gt.point = pi, gt.lineEnd = hi;
}
function hi() {
  gt.point = gt.lineEnd = _;
}
function pi(n, t) {
  n *= b, t *= b, Mn = n, kt = P(t), It = L(t), gt.point = di;
}
function di(n, t) {
  n *= b, t *= b;
  var i = P(t), e = L(t), r = k(n - Mn), o = L(r), l = P(r), u = e * l, g = It * i - kt * e * o, h = kt * i + It * e * o;
  wn.add(tt(nt(u * u + g * g), h)), Mn = n, kt = i, It = e;
}
function gi(n) {
  return wn = new W(), ot(n, gt), +wn;
}
var Pn = [null, null], vi = { type: "LineString", coordinates: Pn };
function Ln(n, t) {
  return Pn[0] = n, Pn[1] = t, gi(vi);
}
var qn = {
  Feature: function(n, t) {
    return Zt(n.geometry, t);
  },
  FeatureCollection: function(n, t) {
    for (var i = n.features, e = -1, r = i.length; ++e < r; ) if (Zt(i[e].geometry, t)) return !0;
    return !1;
  }
}, Jn = {
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
    return Qn(n.coordinates, t);
  },
  MultiLineString: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) if (Qn(i[e], t)) return !0;
    return !1;
  },
  Polygon: function(n, t) {
    return te(n.coordinates, t);
  },
  MultiPolygon: function(n, t) {
    for (var i = n.coordinates, e = -1, r = i.length; ++e < r; ) if (te(i[e], t)) return !0;
    return !1;
  },
  GeometryCollection: function(n, t) {
    for (var i = n.geometries, e = -1, r = i.length; ++e < r; ) if (Zt(i[e], t)) return !0;
    return !1;
  }
};
function Zt(n, t) {
  return n && Jn.hasOwnProperty(n.type) ? Jn[n.type](n, t) : !1;
}
function Vn(n, t) {
  return Ln(n, t) === 0;
}
function Qn(n, t) {
  for (var i, e, r, o = 0, l = n.length; o < l; o++) {
    if (e = Ln(n[o], t), e === 0 || o > 0 && (r = Ln(n[o], n[o - 1]), r > 0 && i <= r && e <= r && (i + e - r) * (1 - Math.pow((i - e) / r, 2)) < _t * r))
      return !0;
    i = e;
  }
  return !1;
}
function te(n, t) {
  return !!Pe(n.map(yi), Re(t));
}
function yi(n) {
  return n = n.map(Re), n.pop(), n;
}
function Re(n) {
  return [n[0] * b, n[1] * b];
}
function on(n, t) {
  return (n && qn.hasOwnProperty(n.type) ? qn[n.type] : Zt)(n, t);
}
function ne(n, t, i) {
  var e = ft(n, t - z, i).concat(t);
  return function(r) {
    return e.map(function(o) {
      return [r, o];
    });
  };
}
function ee(n, t, i) {
  var e = ft(n, t - z, i).concat(t);
  return function(r) {
    return e.map(function(o) {
      return [o, r];
    });
  };
}
function mi() {
  var n, t, i, e, r, o, l, u, g = 10, h = g, s = 90, a = 360, c, f, p, E, y = 2.5;
  function m() {
    return { type: "MultiLineString", coordinates: w() };
  }
  function w() {
    return ft($t(e / s) * s, i, s).map(p).concat(ft($t(u / a) * a, l, a).map(E)).concat(ft($t(t / g) * g, n, g).filter(function(v) {
      return k(v % s) > z;
    }).map(c)).concat(ft($t(o / h) * h, r, h).filter(function(v) {
      return k(v % a) > z;
    }).map(f));
  }
  return m.lines = function() {
    return w().map(function(v) {
      return { type: "LineString", coordinates: v };
    });
  }, m.outline = function() {
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
  }, m.extent = function(v) {
    return arguments.length ? m.extentMajor(v).extentMinor(v) : m.extentMinor();
  }, m.extentMajor = function(v) {
    return arguments.length ? (e = +v[0][0], i = +v[1][0], u = +v[0][1], l = +v[1][1], e > i && (v = e, e = i, i = v), u > l && (v = u, u = l, l = v), m.precision(y)) : [[e, u], [i, l]];
  }, m.extentMinor = function(v) {
    return arguments.length ? (t = +v[0][0], n = +v[1][0], o = +v[0][1], r = +v[1][1], t > n && (v = t, t = n, n = v), o > r && (v = o, o = r, r = v), m.precision(y)) : [[t, o], [n, r]];
  }, m.step = function(v) {
    return arguments.length ? m.stepMajor(v).stepMinor(v) : m.stepMinor();
  }, m.stepMajor = function(v) {
    return arguments.length ? (s = +v[0], a = +v[1], m) : [s, a];
  }, m.stepMinor = function(v) {
    return arguments.length ? (g = +v[0], h = +v[1], m) : [g, h];
  }, m.precision = function(v) {
    return arguments.length ? (y = +v, c = ne(o, r, 90), f = ee(t, n, y), p = ne(u, l, 90), E = ee(e, i, y), m) : y;
  }, m.extentMajor([[-180, -90 + z], [180, 90 - z]]).extentMinor([[-180, -80 - z], [180, 80 + z]]);
}
function Si() {
  return mi()();
}
const Rn = (n) => n;
var sn = new W(), An = new W(), Ae, ze, zn, Cn, st = {
  point: _,
  lineStart: _,
  lineEnd: _,
  polygonStart: function() {
    st.lineStart = Ei, st.lineEnd = Mi;
  },
  polygonEnd: function() {
    st.lineStart = st.lineEnd = st.point = _, sn.add(k(An)), An = new W();
  },
  result: function() {
    var n = sn / 2;
    return sn = new W(), n;
  }
};
function Ei() {
  st.point = wi;
}
function wi(n, t) {
  st.point = Ce, Ae = zn = n, ze = Cn = t;
}
function Ce(n, t) {
  An.add(Cn * n - zn * t), zn = n, Cn = t;
}
function Mi() {
  Ce(Ae, ze);
}
var vt = 1 / 0, qt = vt, Rt = -vt, Jt = Rt, Vt = {
  point: Pi,
  lineStart: _,
  lineEnd: _,
  polygonStart: _,
  polygonEnd: _,
  result: function() {
    var n = [[vt, qt], [Rt, Jt]];
    return Rt = Jt = -(qt = vt = 1 / 0), n;
  }
};
function Pi(n, t) {
  n < vt && (vt = n), n > Rt && (Rt = n), t < qt && (qt = t), t > Jt && (Jt = t);
}
var $n = 0, bn = 0, Et = 0, Qt = 0, tn = 0, ht = 0, Fn = 0, xn = 0, wt = 0, $e, be, V, Q, j = {
  point: ut,
  lineStart: ie,
  lineEnd: re,
  polygonStart: function() {
    j.lineStart = Ai, j.lineEnd = zi;
  },
  polygonEnd: function() {
    j.point = ut, j.lineStart = ie, j.lineEnd = re;
  },
  result: function() {
    var n = wt ? [Fn / wt, xn / wt] : ht ? [Qt / ht, tn / ht] : Et ? [$n / Et, bn / Et] : [NaN, NaN];
    return $n = bn = Et = Qt = tn = ht = Fn = xn = wt = 0, n;
  }
};
function ut(n, t) {
  $n += n, bn += t, ++Et;
}
function ie() {
  j.point = Li;
}
function Li(n, t) {
  j.point = Ri, ut(V = n, Q = t);
}
function Ri(n, t) {
  var i = n - V, e = t - Q, r = nt(i * i + e * e);
  Qt += r * (V + n) / 2, tn += r * (Q + t) / 2, ht += r, ut(V = n, Q = t);
}
function re() {
  j.point = ut;
}
function Ai() {
  j.point = Ci;
}
function zi() {
  Fe($e, be);
}
function Ci(n, t) {
  j.point = Fe, ut($e = V = n, be = Q = t);
}
function Fe(n, t) {
  var i = n - V, e = t - Q, r = nt(i * i + e * e);
  Qt += r * (V + n) / 2, tn += r * (Q + t) / 2, ht += r, r = Q * n - V * t, Fn += r * (V + n), xn += r * (Q + t), wt += r * 3, ut(V = n, Q = t);
}
function xe(n) {
  this._context = n;
}
xe.prototype = {
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
        this._context.moveTo(n + this._radius, t), this._context.arc(n, t, this._radius, 0, B);
        break;
      }
    }
  },
  result: _
};
var Tn = new W(), an, Te, Ne, Mt, Pt, At = {
  point: _,
  lineStart: function() {
    At.point = $i;
  },
  lineEnd: function() {
    an && ke(Te, Ne), At.point = _;
  },
  polygonStart: function() {
    an = !0;
  },
  polygonEnd: function() {
    an = null;
  },
  result: function() {
    var n = +Tn;
    return Tn = new W(), n;
  }
};
function $i(n, t) {
  At.point = ke, Te = Mt = n, Ne = Pt = t;
}
function ke(n, t) {
  Mt -= n, Pt -= t, Tn.add(nt(Mt * Mt + Pt * Pt)), Mt = n, Pt = t;
}
let oe, nn, se, ae;
class le {
  constructor(t) {
    this._append = t == null ? Ie : bi(t), this._radius = 4.5, this._ = "";
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
        if (this._append`M${t},${i}`, this._radius !== se || this._append !== nn) {
          const e = this._radius, r = this._;
          this._ = "", this._append`m0,${e}a${e},${e} 0 1,1 0,${-2 * e}a${e},${e} 0 1,1 0,${2 * e}z`, se = e, nn = this._append, ae = this._, this._ = r;
        }
        this._ += ae;
        break;
      }
    }
  }
  result() {
    const t = this._;
    return this._ = "", t.length ? t : null;
  }
}
function Ie(n) {
  let t = 1;
  this._ += n[0];
  for (const i = n.length; t < i; ++t)
    this._ += arguments[t] + n[t];
}
function bi(n) {
  const t = Math.floor(n);
  if (!(t >= 0)) throw new RangeError(`invalid digits: ${n}`);
  if (t > 15) return Ie;
  if (t !== oe) {
    const i = 10 ** t;
    oe = t, nn = function(r) {
      let o = 1;
      this._ += r[0];
      for (const l = r.length; o < l; ++o)
        this._ += Math.round(arguments[o] * i) / i + r[o];
    };
  }
  return nn;
}
function Fi(n, t) {
  let i = 3, e = 4.5, r, o;
  function l(u) {
    return u && (typeof e == "function" && o.pointRadius(+e.apply(this, arguments)), ot(u, r(o))), o.result();
  }
  return l.area = function(u) {
    return ot(u, r(st)), st.result();
  }, l.measure = function(u) {
    return ot(u, r(At)), At.result();
  }, l.bounds = function(u) {
    return ot(u, r(Vt)), Vt.result();
  }, l.centroid = function(u) {
    return ot(u, r(j)), j.result();
  }, l.projection = function(u) {
    return arguments.length ? (r = u == null ? (n = null, Rn) : (n = u).stream, l) : n;
  }, l.context = function(u) {
    return arguments.length ? (o = u == null ? (t = null, new le(i)) : new xe(t = u), typeof e != "function" && o.pointRadius(e), l) : t;
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
    return t === null && (o = new le(i)), l;
  }, l.projection(n).digits(i).context(t);
}
function In(n) {
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
function _n(n, t, i) {
  var e = n.clipExtent && n.clipExtent();
  return n.scale(150).translate([0, 0]), e != null && n.clipExtent(null), ot(i, n.stream(Vt)), t(Vt.result()), e != null && n.clipExtent(e), n;
}
function _e(n, t, i) {
  return _n(n, function(e) {
    var r = t[1][0] - t[0][0], o = t[1][1] - t[0][1], l = Math.min(r / (e[1][0] - e[0][0]), o / (e[1][1] - e[0][1])), u = +t[0][0] + (r - l * (e[1][0] + e[0][0])) / 2, g = +t[0][1] + (o - l * (e[1][1] + e[0][1])) / 2;
    n.scale(150 * l).translate([u, g]);
  }, i);
}
function xi(n, t, i) {
  return _e(n, [[0, 0], t], i);
}
function Ti(n, t, i) {
  return _n(n, function(e) {
    var r = +t, o = r / (e[1][0] - e[0][0]), l = (r - o * (e[1][0] + e[0][0])) / 2, u = -o * e[0][1];
    n.scale(150 * o).translate([l, u]);
  }, i);
}
function Ni(n, t, i) {
  return _n(n, function(e) {
    var r = +t, o = r / (e[1][1] - e[0][1]), l = -o * e[0][0], u = (r - o * (e[1][1] + e[0][1])) / 2;
    n.scale(150 * o).translate([l, u]);
  }, i);
}
var ue = 16, ki = L(30 * b);
function ce(n, t) {
  return +t ? _i(n, t) : Ii(n);
}
function Ii(n) {
  return In({
    point: function(t, i) {
      t = n(t, i), this.stream.point(t[0], t[1]);
    }
  });
}
function _i(n, t) {
  function i(e, r, o, l, u, g, h, s, a, c, f, p, E, y) {
    var m = h - e, w = s - r, v = m * m + w * w;
    if (v > 4 * t && E--) {
      var S = l + c, R = u + f, A = g + p, T = nt(S * S + R * R + A * A), F = at(A /= T), x = k(k(A) - 1) < z || k(o - a) < z ? (o + a) / 2 : tt(R, S), I = n(x, F), M = I[0], X = I[1], K = M - e, N = X - r, d = w * K - m * N;
      (d * d / v > t || k((m * K + w * N) / v - 0.5) > 0.3 || l * c + u * f + g * p < ki) && (i(e, r, o, l, u, g, M, X, x, S /= T, R /= T, A, E, y), y.point(M, X), i(M, X, x, S, R, A, h, s, a, c, f, p, E, y));
    }
  }
  return function(e) {
    var r, o, l, u, g, h, s, a, c, f, p, E, y = {
      point: m,
      lineStart: w,
      lineEnd: S,
      polygonStart: function() {
        e.polygonStart(), y.lineStart = R;
      },
      polygonEnd: function() {
        e.polygonEnd(), y.lineStart = w;
      }
    };
    function m(F, x) {
      F = n(F, x), e.point(F[0], F[1]);
    }
    function w() {
      a = NaN, y.point = v, e.lineStart();
    }
    function v(F, x) {
      var I = dt([F, x]), M = n(F, x);
      i(a, c, s, f, p, E, a = M[0], c = M[1], s = F, f = I[0], p = I[1], E = I[2], ue, e), e.point(a, c);
    }
    function S() {
      y.point = m, e.lineEnd();
    }
    function R() {
      w(), y.point = A, y.lineEnd = T;
    }
    function A(F, x) {
      v(r = F, x), o = a, l = c, u = f, g = p, h = E, y.point = v;
    }
    function T() {
      i(a, c, s, f, p, E, o, l, r, u, g, h, ue, e), y.lineEnd = S, S();
    }
    return y;
  };
}
var Ki = In({
  point: function(n, t) {
    this.stream.point(n * b, t * b);
  }
});
function Yi(n) {
  return In({
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
function fe(n, t, i, e, r, o) {
  if (!o) return Di(n, t, i, e, r);
  var l = L(o), u = P(o), g = l * n, h = u * n, s = l / n, a = u / n, c = (u * i - l * t) / n, f = (u * t + l * i) / n;
  function p(E, y) {
    return E *= e, y *= r, [g * E - h * y + t, i - h * E - g * y];
  }
  return p.invert = function(E, y) {
    return [e * (s * E - a * y + c), r * (f - a * E - s * y)];
  }, p;
}
function Oi(n) {
  return Gi(function() {
    return n;
  })();
}
function Gi(n) {
  var t, i = 150, e = 480, r = 250, o = 0, l = 0, u = 0, g = 0, h = 0, s, a = 0, c = 1, f = 1, p = null, E = Zn, y = null, m, w, v, S = Rn, R = 0.5, A, T, F, x, I;
  function M(d) {
    return F(d[0] * b, d[1] * b);
  }
  function X(d) {
    return d = F.invert(d[0], d[1]), d && [d[0] * q, d[1] * q];
  }
  M.stream = function(d) {
    return x && I === d ? x : x = Ki(Yi(s)(E(A(S(I = d)))));
  }, M.preclip = function(d) {
    return arguments.length ? (E = d, p = void 0, N()) : E;
  }, M.postclip = function(d) {
    return arguments.length ? (S = d, y = m = w = v = null, N()) : S;
  }, M.clipAngle = function(d) {
    return arguments.length ? (E = +d ? li(p = d * b) : (p = null, Zn), N()) : p * q;
  }, M.clipExtent = function(d) {
    return arguments.length ? (S = d == null ? (y = m = w = v = null, Rn) : ci(y = +d[0][0], m = +d[0][1], w = +d[1][0], v = +d[1][1]), N()) : y == null ? null : [[y, m], [w, v]];
  }, M.scale = function(d) {
    return arguments.length ? (i = +d, K()) : i;
  }, M.translate = function(d) {
    return arguments.length ? (e = +d[0], r = +d[1], K()) : [e, r];
  }, M.center = function(d) {
    return arguments.length ? (o = d[0] % 360 * b, l = d[1] % 360 * b, K()) : [o * q, l * q];
  }, M.rotate = function(d) {
    return arguments.length ? (u = d[0] % 360 * b, g = d[1] % 360 * b, h = d.length > 2 ? d[2] % 360 * b : 0, K()) : [u * q, g * q, h * q];
  }, M.angle = function(d) {
    return arguments.length ? (a = d % 360 * b, K()) : a * q;
  }, M.reflectX = function(d) {
    return arguments.length ? (c = d ? -1 : 1, K()) : c < 0;
  }, M.reflectY = function(d) {
    return arguments.length ? (f = d ? -1 : 1, K()) : f < 0;
  }, M.precision = function(d) {
    return arguments.length ? (A = ce(T, R = d * d), N()) : nt(R);
  }, M.fitExtent = function(d, C) {
    return _e(M, d, C);
  }, M.fitSize = function(d, C) {
    return xi(M, d, C);
  }, M.fitWidth = function(d, C) {
    return Ti(M, d, C);
  }, M.fitHeight = function(d, C) {
    return Ni(M, d, C);
  };
  function K() {
    var d = fe(i, 0, 0, c, f, a).apply(null, t(o, l)), C = fe(i, e - d[0], r - d[1], c, f, a);
    return s = ni(u, g, h), T = Sn(t, C), F = Sn(s, T), A = ce(T, R), N();
  }
  function N() {
    return x = I = null, M;
  }
  return function() {
    return t = n.apply(this, arguments), M.invert = t.invert && X, K();
  };
}
function Wi(n) {
  return function(t, i) {
    var e = nt(t * t + i * i), r = n(e), o = P(r), l = L(r);
    return [
      tt(t * o, e * l),
      at(e && i * o / e)
    ];
  };
}
function Ke(n, t) {
  return [L(t) * P(n), P(t)];
}
Ke.invert = Wi(at);
function Xi() {
  return Oi(Ke).scale(249.5).clipAngle(90 + z);
}
function Ui(n) {
  return n;
}
function Bi(n) {
  if (n == null) return Ui;
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
    return he(n, i);
  }) } : he(n, t);
}
function he(n, t) {
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
function Zi(n, t) {
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
        var y = p === f ? f : p.concat(f);
        e[y.start = p.start] = r[y.end = f.end] = y;
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
function qi(n) {
  return Ye(n, Ji.apply(this, arguments));
}
function Ji(n, t, i) {
  var e, r, o;
  if (arguments.length > 1) e = Vi(n, t, i);
  else for (r = 0, e = new Array(o = n.arcs.length); r < o; ++r) e[r] = r;
  return { type: "MultiLineString", arcs: Zi(n, e) };
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
async function Qi(n) {
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
async function tr(n, t) {
  var e;
  let i = "";
  try {
    const r = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&lat=${t}&lon=${n}`, o = await fetch(r).then((l) => l.json());
    i = (((e = o == null ? void 0 : o.address) == null ? void 0 : e.country_code) || "").toUpperCase();
  } catch {
  }
  return { cc: i, tz: De(n), approxTz: !0 };
}
const nr = {
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
function pe(n) {
  return n && nr[n.toUpperCase()] || "en";
}
const pt = "planetlogin:locale";
function er(n, t = pt) {
  try {
    const i = n == null ? void 0 : n.getItem(t);
    if (!i) return null;
    const e = JSON.parse(i);
    return typeof (e == null ? void 0 : e.lat) == "number" && typeof (e == null ? void 0 : e.lon) == "number" ? e : null;
  } catch {
    return null;
  }
}
function ir(n, t, i = pt) {
  try {
    n == null || n.setItem(i, JSON.stringify(t));
  } catch {
  }
}
function rr(n, t = pt) {
  try {
    n == null || n.removeItem(t);
  } catch {
  }
}
const rt = (n, t, i) => n < t ? t : n > i ? i : n, or = (n) => n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2, sr = (n) => 1 - (1 - n) * (1 - n), ar = (n, t) => ((t - n) % 360 + 540) % 360 - 180, lr = (n) => `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${n}.json`;
class Oe {
  constructor(t, i = {}) {
    this.listeners = [], this.W = 0, this.H = 0, this.DPR = 1, this.cx = 0, this.cy = 0, this.baseR = 0, this.R = 0, this.stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.6 + 0.2,
      p: Math.random() * 6
    })), this.countriesFC = null, this.bordersMesh = null, this.graticule = Si(), this.lastProjection = null, this.hoverFeat = null, this.selectedFeat = null, this.mode = "idle", this.lon0 = 20, this.lat0 = 25, this.fromLon = 0, this.fromLat = 0, this.toLon = 0, this.toLat = 0, this.t0 = 0, this.zStart = 1, this.zTarget = 2.6, this.zFrom = 1, this.dragging = !1, this.vlon = 0.12, this.vlat = 0, this.zoomK = 1, this.reduceMotion = !1, this.detected = null, this.raf = 0, this.lastX = 0, this.lastY = 0, this.moved = 0, this.target = t, this.opts = {
      accent: i.accent ?? "#f6a13c",
      search: i.search ?? !0,
      autoSpin: i.autoSpin ?? !0,
      resolution: i.resolution ?? "110m",
      ...i
    }, this.reduceMotion = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, this.autoSpin = this.reduceMotion ? !1 : this.opts.autoSpin, getComputedStyle(t).position === "static" && (t.style.position = "relative"), t.style.overflow = "hidden", this.cv = document.createElement("canvas"), this.cv.tabIndex = 0, this.cv.setAttribute("role", "application"), this.cv.setAttribute("aria-label", "Interactive globe. Arrow keys rotate, plus and minus zoom, Enter selects the country at the centre. Or use the search box below."), Object.assign(this.cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }), t.appendChild(this.cv), this.ctx = this.cv.getContext("2d"), this.opts.search && this.buildSearch(), this.buildWatermark(), this.bindEvents(), this.loadData(), this.resize(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(t), this.raf = requestAnimationFrame((e) => this.loop(e)), this.opts.flyToSaved && this.restoreSaved();
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
    const e = await Qi(i);
    e && (this.detected = { lat: e.lat, lon: e.lon, country: e.cc, timezone: e.tz, language: pe(e.cc), label: e.label, approxTimezone: e.approxTz }, this.flyTo(e.lon, e.lat));
  }
  /** The remembered locale for this device, or null. Reads browser storage
   *  (the same key the globe writes when `remember` is on). Devs can call this
   *  to read the saved value without an instance event. */
  getSavedLocale() {
    return er(this.store(), this.opts.storageKey ?? pt);
  }
  /** Forget the remembered locale on this device. */
  clearSavedLocale() {
    rr(this.store(), this.opts.storageKey ?? pt);
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
    this.opts.remember && this.saveLocale(t);
    for (const r of this.listeners) r(t);
    this.target.dispatchEvent(new CustomEvent("locale", { detail: t, bubbles: !0 })), (e = (i = this.opts).onLocale) == null || e.call(i, t);
  }
  // ── Tier 0 locale memory (device-local) ───────────────────────────────────
  /** The storage backend, honoring opts.storage; null when disabled/unavailable. */
  store() {
    if (this.opts.storage === "none" || typeof window > "u") return null;
    try {
      return this.opts.storage === "session" ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }
  saveLocale(t) {
    ir(this.store(), t, this.opts.storageKey ?? pt);
  }
  restoreSaved() {
    const t = this.getSavedLocale();
    t && (this.detected = t, this.flyTo(t.lon, t.lat));
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
      const t = this.opts.dataUrl ?? lr(this.opts.resolution), i = await fetch(t).then((e) => e.json());
      this.countriesFC = ji(i, i.objects.countries), this.bordersMesh = qi(i, i.objects.countries, (e, r) => e !== r);
    } catch (t) {
      console.warn("[planetlogin] country data failed to load", t);
    }
  }
  resize() {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2), this.W = this.target.clientWidth, this.H = this.target.clientHeight, this.cv.width = this.W * this.DPR, this.cv.height = this.H * this.DPR, this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0), this.cx = this.W / 2, this.cy = this.H / 2, this.baseR = Math.min(this.W, this.H) * 0.34, this.mode === "idle" && (this.R = this.baseR * this.zoomK);
  }
  featureCenter(t) {
    const i = t.geometry;
    if (i.type === "Polygon") return Wn(t);
    let e = null, r = -1;
    for (const o of i.coordinates) {
      const l = { type: "Polygon", coordinates: o }, u = Ze(l);
      u > r && (r = u, e = l);
    }
    return Wn(e || t);
  }
  countryAt(t, i) {
    var o, l;
    if (!this.countriesFC || !this.lastProjection) return null;
    const e = this.cv.getBoundingClientRect(), r = (l = (o = this.lastProjection).invert) == null ? void 0 : l.call(o, [t - e.left, i - e.top]);
    if (!r || isNaN(r[0])) return null;
    for (const u of this.countriesFC.features) if (on(u, r)) return u;
    return null;
  }
  /** The country under the globe's centre point (current rotation). */
  countryAtCenter() {
    if (!this.countriesFC) return null;
    for (const t of this.countriesFC.features) if (on(t, [this.lon0, this.lat0])) return t;
    return null;
  }
  async pickFeature(t) {
    var o;
    const [i, e] = this.featureCenter(t);
    this.flyTo(i, e);
    const r = await tr(i, e);
    this.detected = { lat: e, lon: i, country: r.cc, timezone: r.tz, language: pe(r.cc), label: ((o = t.properties) == null ? void 0 : o.name) ?? "", approxTimezone: r.approxTz };
  }
  onLocated() {
    this.detected && (this.autoSpin = !1, this.selectedFeat = this.countriesFC && this.countriesFC.features.find((t) => on(t, [this.detected.lon, this.detected.lat])) || null, this.emit());
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
      const i = Math.min(1, (t - this.t0) / (this.reduceMotion ? 120 : 1100)), e = or(i);
      this.lon0 = this.fromLon + ar(this.fromLon, this.toLon) * e, this.lat0 = this.fromLat + (this.toLat - this.fromLat) * e, this.zoomK = this.zFrom + (1 - this.zFrom) * e, this.R = this.baseR * this.zoomK, i >= 1 && (this.mode = "zoom", this.t0 = t, this.zStart = 1, this.zTarget = 2.6);
    } else {
      const i = Math.min(1, (t - this.t0) / (this.reduceMotion ? 100 : 750)), e = sr(i);
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
    const s = Xi().translate([e, r]).scale(o).clipAngle(90).rotate([-this.lon0, -this.lat0]);
    this.lastProjection = s;
    const a = Fi(s, i);
    i.beginPath(), a(this.graticule), i.strokeStyle = "rgba(255,255,255,.07)", i.lineWidth = 1, i.stroke(), this.countriesFC && (i.beginPath(), a(this.countriesFC), i.fillStyle = "rgba(70,160,116,.92)", i.fill()), this.selectedFeat && (i.beginPath(), a(this.selectedFeat), i.fillStyle = this.hexA(this.opts.accent, 0.7), i.fill(), i.strokeStyle = this.opts.accent, i.lineWidth = 1.4, i.stroke()), this.hoverFeat && this.hoverFeat !== this.selectedFeat && (i.beginPath(), a(this.hoverFeat), i.fillStyle = this.hexA(this.opts.accent, 0.5), i.fill()), this.bordersMesh && (i.beginPath(), a(this.bordersMesh), i.strokeStyle = "rgba(10,28,48,.85)", i.lineWidth = 0.6, i.stroke()), i.restore(), i.strokeStyle = "rgba(150,200,255,.25)", i.lineWidth = 1.5, i.beginPath(), i.arc(e, r, o, 0, 7), i.stroke();
  }
  hexA(t, i) {
    const e = t.replace("#", ""), r = e.length === 3 ? e.split("").map((g) => g + g).join("") : e, o = parseInt(r.slice(0, 2), 16), l = parseInt(r.slice(2, 4), 16), u = parseInt(r.slice(4, 6), 16);
    return `rgba(${o},${l},${u},${i})`;
  }
}
class ur extends HTMLElement {
  static get observedAttributes() {
    return ["accent", "resolution", "search", "placeholder"];
  }
  connectedCallback() {
    getComputedStyle(this).display === "inline" && (this.style.display = "block");
    const t = {
      accent: this.getAttribute("accent") ?? void 0,
      resolution: this.getAttribute("resolution") ?? void 0,
      // Override the world-atlas TopoJSON URL — e.g. a same-origin copy so the globe
      // never depends on a third-party CDN at runtime (CSP/adblock/offline proof).
      dataUrl: this.getAttribute("data-url") ?? void 0,
      placeholder: this.getAttribute("placeholder") ?? void 0,
      search: this.getAttribute("search") !== "false",
      autoSpin: this.getAttribute("autospin") !== "false",
      // Boolean attributes: present (any value incl. "") → on.
      remember: this.hasAttribute("remember"),
      flyToSaved: this.hasAttribute("fly-to-saved"),
      storageKey: this.getAttribute("storage-key") ?? void 0,
      storage: this.getAttribute("storage") ?? void 0
    };
    this.instance = new Oe(this, t);
  }
  disconnectedCallback() {
    var t;
    (t = this.instance) == null || t.destroy(), this.instance = void 0;
  }
  // ── Imperative API (drive the globe from the host page) ───────────────────
  /** Fly the globe to coordinates and pick them. */
  flyTo(t, i) {
    var e;
    (e = this.instance) == null || e.flyTo(t, i);
  }
  /** The locale remembered on this device (Tier 0), or null. */
  getSavedLocale() {
    var t;
    return ((t = this.instance) == null ? void 0 : t.getSavedLocale()) ?? null;
  }
  /** Forget the remembered locale on this device. */
  clearSavedLocale() {
    var t;
    (t = this.instance) == null || t.clearSavedLocale();
  }
}
function cr(n, t) {
  return new Oe(n, t);
}
typeof customElements < "u" && !customElements.get("planet-login") && customElements.define("planet-login", ur);
export {
  pt as DEFAULT_STORAGE_KEY,
  Oe as PlanetLogin,
  ur as PlanetLoginElement,
  rr as clearSavedLocale,
  cr as createPlanetLogin,
  er as readSavedLocale,
  ir as writeSavedLocale
};
