(function (global) {
  const stop = new Set(['the','is','at','which','on','and','a','an','for','to','in','of','with','by','from','as','it','this','that','be','are','or','not','you','your','me','my','we','our','us','they','their','them','can','could','would','should','about','into','over','under','than','up','down','out','any','some','more','most','less']);

  function tok(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter(t => t && t.length > 1 && !stop.has(t));
  }

  function buildDocs(products) {
    return products.map(p => ({
      id: p.id,
      ref: p,
      title: p.title || '',
      desc: p.description || '',
      cat: p.category || '',
      brand: p.brand || '',
      price: Number(p.price || 0),
      rating: Number(p.rating || 0),
      tokens: new Set(tok(((p.title || '') + ' ' + (p.category || '') + ' ' + (p.brand || '') + ' ' + (p.description || ''))))
    }));
  }

  function priceStats(all) {
    let min = Infinity, max = -Infinity;
    for (const d of all) { if (d.price < min) min = d.price; if (d.price > max) max = d.price; }
    if (!isFinite(min)) min = 0; if (!isFinite(max)) max = 1;
    return { min, max, span: Math.max(1, max - min) };
  }

  function avgPrice(docs) {
    if (!docs.length) return null;
    let s = 0; for (const d of docs) s += d.price;
    return s / docs.length;
  }

  function maxTokenOverlap(aTokens, savedDocs) {
    if (!savedDocs.length) return 0;
    let best = 0;
    for (const s of savedDocs) {
      let inter = 0;
      for (const t of aTokens) { if (s.tokens.has(t)) inter++; }
      const union = aTokens.size + s.tokens.size - inter;
      const j = union ? inter / union : 0;
      if (j > best) best = j;
    }
    return best; // [0,1]
  }

  function queryMatchScore(tokens, queryTokens) {
    if (!queryTokens.length) return 0;
    let inter = 0;
    for (const t of queryTokens) { if (tokens.has(t)) inter++; }
    return inter / queryTokens.length; // fraction of query terms matched
  }

  function categoryPrefs(savedDocs) {
    const m = new Map();
    for (const d of savedDocs) m.set(d.cat, (m.get(d.cat) || 0) + 1);
    let total = 0; for (const v of m.values()) total += v;
    if (!total) return m;
    for (const [k, v] of m.entries()) m.set(k, v / total);
    return m; // normalized weights
  }

  const defaultWeights = {
    wCat: 1.2,
    wSim: 1.5,
    wRating: 0.8,
    wPrice: 0.7,
    wQuery: 1.0,
  };

  function recommend(products, savedIds, signals = {}, k = 10, weights = defaultWeights) {
    const docs = buildDocs(products);
    const allById = new Map(docs.map(d => [d.id, d]));
    const savedDocs = (savedIds || []).map(id => allById.get(id)).filter(Boolean);
    const queryTokens = tok(signals.searchTerm || '');
    const catFilter = signals.categoryFilter || '';
    const minRating = parseFloat(signals.minRatingFilter || 0) || 0;

    const { min, span } = priceStats(docs);
    const prefPrice = avgPrice(savedDocs);
    const catPref = categoryPrefs(savedDocs);

    const out = [];
    for (const d of docs) {
      if ((savedIds || []).includes(d.id)) continue;
      if (catFilter && d.cat !== catFilter) continue;
      if (d.rating < minRating) continue;

      let s = 0;
      const catWeight = catPref.get(d.cat) || 0;
      s += weights.wCat * catWeight;

      const sim = maxTokenOverlap(d.tokens, savedDocs);
      s += weights.wSim * sim;

      s += weights.wRating * (d.rating / 5);

      if (prefPrice != null) {
        const priceCloseness = 1 - Math.min(1, Math.abs(d.price - prefPrice) / span);
        s += weights.wPrice * priceCloseness;
      }

      const qm = queryMatchScore(d.tokens, queryTokens);
      s += weights.wQuery * qm;

      out.push({ d, s });
    }

    if (!out.length) {
      // fallback: top-rated items (excluding saved), then by price closeness to median
      const notSaved = docs.filter(d => !(savedIds || []).includes(d.id) && (!catFilter || d.cat === catFilter) && d.rating >= minRating);
      notSaved.sort((a, b) => (b.rating - a.rating) || (a.price - b.price));
      return notSaved.slice(0, k).map(x => x.ref);
    }

    out.sort((a, b) => b.s - a.s);

    const picked = [];
    const seenCats = new Map();
    for (const r of out) {
      const c = r.d.cat;
      const count = seenCats.get(c) || 0;
      // slight diversity: skip if category already dominates and we still have alternatives
      if (count >= Math.ceil(k / 2)) continue;
      picked.push(r.d.ref);
      seenCats.set(c, count + 1);
      if (picked.length >= k) break;
    }

    if (picked.length < k) {
      for (const r of out) {
        if (!picked.includes(r.d.ref)) picked.push(r.d.ref);
        if (picked.length >= k) break;
      }
    }

    return picked.slice(0, k);
  }

  global.Agent = {
    recommend,
    setWeights: function (w) { Object.assign(defaultWeights, w || {}); }
  };
})(window);
