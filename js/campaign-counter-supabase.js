(function (root, factory) {
  root.CampaignRegistryService = factory(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  function getConfig() {
    const config = root.EDM_SUPABASE_CONFIG;
    return config?.url && config?.anonKey ? config : null;
  }

  function client() {
    const config = getConfig();
    if (!config) throw new Error('CONFIG_MISSING');
    if (!root.EDM_SUPABASE_CLIENT) {
      if (!root.supabase?.createClient) throw new Error('CLIENT_UNAVAILABLE');
      root.EDM_SUPABASE_CLIENT = root.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
    }
    return root.EDM_SUPABASE_CLIENT;
  }

  function unwrap(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  async function loadLastCampaign() {
    const data = unwrap(await client()
      .from('campaign_registry')
      .select('campaign_id,generated_at')
      .order('generated_at', { ascending: false })
      .limit(1));
    return data?.[0] || null;
  }

  async function checkConnection() {
    if (!getConfig()) return { connected: false, reason: 'config' };
    try {
      await loadLastCampaign();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: 'network' };
    }
  }

  async function loadRecentActivity() {
    const data = unwrap(await client()
      .from('campaign_registry')
      .select('campaign_id,generated_at,generated_by,action,note')
      .order('generated_at', { ascending: false })
      .limit(20));
    return data || [];
  }

  async function generateCampaign(activeCampaignId, username) {
    const nextCampaignId = Math.max(1, Number.parseInt(activeCampaignId, 10) + 1 || 1);
    const data = unwrap(await client().rpc('set_next_campaign_id', {
      p_next_campaign_id: nextCampaignId,
      p_generated_by: username,
      p_note: 'Generated from active counter'
    }));
    return Array.isArray(data) ? data[0] : data;
  }

  async function setNextCampaignId(nextCampaignId, username, note) {
    const data = unwrap(await client().rpc('set_next_campaign_id', {
      p_next_campaign_id: nextCampaignId,
      p_generated_by: username,
      p_note: note || null
    }));
    return Array.isArray(data) ? data[0] : data;
  }

  return { checkConnection, loadLastCampaign, loadRecentActivity, generateCampaign, setNextCampaignId };
});
