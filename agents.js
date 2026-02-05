(function (global) {
  function tok(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(t => t && t.length > 1);
  }
  function qscore(tokens, qtokens) {
    if (!qtokens.length) return 0;
    let m = 0; for (const t of qtokens) if (tokens.has(t)) m++;
    return m / qtokens.length;
  }
  function priceStats(arr) {
    let min = Infinity, max = -Infinity;
    for (const p of arr) { const v = Number(p.price || 0); if (v < min) min = v; if (v > max) max = v; }
    if (!isFinite(min)) min = 0; if (!isFinite(max)) max = 1;
    const span = Math.max(1, max - min);
    return { min, span };
  }

  const ReflexAgent = {
    recommend(products, savedIds, signals = {}, k = 10) {
      const saved = new Set(savedIds || []);
      const qtokens = tok(signals.searchTerm || '');
      const catFilter = signals.categoryFilter || '';
      const minRating = parseFloat(signals.minRatingFilter || 0) || 0;
      const savedCats = new Set(products.filter(p => saved.has(p.id)).map(p => p.category));
      const out = [];
      for (const p of products) {
        if (saved.has(p.id)) continue;
        if (catFilter && p.category !== catFilter) continue;
        if ((p.rating || 0) < minRating) continue;
        const tokens = new Set(tok(((p.title || '') + ' ' + (p.brand || '') + ' ' + (p.category || '') + ' ' + (p.description || ''))));
        const qm = qscore(tokens, qtokens);
        let s = 0;
        s += 1.5 * qm;
        s += 1.0 * (savedCats.has(p.category) ? 1 : 0);
        s += 0.8 * ((Number(p.rating || 0)) / 5);
        out.push({ p, s });
      }
      out.sort((a, b) => (b.s - a.s) || ((Number(b.p.rating || 0)) - (Number(a.p.rating || 0))) || (Number(a.p.price || 0) - Number(b.p.price || 0)));
      return out.slice(0, k).map(x => x.p);
    }
  };

  const ModelBasedAgent = {
    buildModel(products, savedIds) {
      const saved = new Set(savedIds || []);
      const cat = Object.create(null);
      const brand = Object.create(null);
      let ps = 0, pc = 0;
      for (const p of products) {
        if (!saved.has(p.id)) continue;
        cat[p.category] = (cat[p.category] || 0) + 1;
        brand[p.brand] = (brand[p.brand] || 0) + 1;
        if (p.price != null) { ps += Number(p.price); pc++; }
      }
      const totalCat = Object.values(cat).reduce((a, b) => a + b, 0) || 0;
      const totalBrand = Object.values(brand).reduce((a, b) => a + b, 0) || 0;
      const catW = Object.create(null);
      const brandW = Object.create(null);
      if (totalCat) for (const k of Object.keys(cat)) catW[k] = cat[k] / totalCat;
      if (totalBrand) for (const k of Object.keys(brand)) brandW[k] = brand[k] / totalBrand;
      const avgPrice = pc ? (ps / pc) : null;
      const model = { cat: catW, brand: brandW, avgPrice: avgPrice };
      try { localStorage.setItem('userModel', JSON.stringify(model)); } catch (e) {}
      return model;
    },
    recommend(products, savedIds, signals = {}, k = 10) {
      const qtokens = tok(signals.searchTerm || '');
      const catFilter = signals.categoryFilter || '';
      const minRating = parseFloat(signals.minRatingFilter || 0) || 0;
      const saved = new Set(savedIds || []);
      const model = this.buildModel(products, savedIds || []);
      const { min, span } = priceStats(products);
      const out = [];
      for (const p of products) {
        if (saved.has(p.id)) continue;
        if (catFilter && p.category !== catFilter) continue;
        if ((p.rating || 0) < minRating) continue;
        const tokens = new Set(tok(((p.title || '') + ' ' + (p.brand || '') + ' ' + (p.category || '') + ' ' + (p.description || ''))));
        const qm = qscore(tokens, qtokens);
        let s = 0;
        s += 1.2 * (model.cat[p.category] || 0);
        s += 1.0 * (model.brand[p.brand] || 0);
        s += 0.9 * ((Number(p.rating || 0)) / 5);
        if (model.avgPrice != null) {
          const pc = 1 - Math.min(1, Math.abs(Number(p.price || 0) - model.avgPrice) / span);
          s += 0.8 * pc;
        }
        s += 1.0 * qm;
        out.push({ p, s });
      }
      out.sort((a, b) => (b.s - a.s) || ((Number(b.p.rating || 0)) - (Number(a.p.rating || 0))) || (Number(a.p.price || 0) - Number(b.p.price || 0)));
      const res = out.slice(0, k).map(x => x.p);
      return res;
    }
  };

  const Recs = {
    current: 'reflex',
    setAgent(name) {
      const n = String(name || '').toLowerCase();
      if (n === 'reflex' || n === 'model' || n === 'classic') this.current = n;
    },
    recommend(products, savedIds, signals = {}, k = 10) {
      if (this.current === 'model') return ModelBasedAgent.recommend(products, savedIds, signals, k);
      if (this.current === 'classic' && global.Agent && typeof global.Agent.recommend === 'function') return global.Agent.recommend(products, savedIds, signals, k);
      return ReflexAgent.recommend(products, savedIds, signals, k);
    }
  };

  global.ReflexAgent = ReflexAgent;
  global.ModelBasedAgent = ModelBasedAgent;
  global.Recs = Recs;
})(window);
