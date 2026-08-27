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

  async function loadCounter() {
    const data = unwrap(await client()
      .from('campaign_counter')
      .select('current_value')
      .eq('id', 1)
      .maybeSingle());
    return data?.current_value ?? 0;
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
      await loadCounter();
      return { connected: true };
    } catch (error) {
      return { connected: false, reason: 'network' };
    }
  }

  async function loadRecentActivity() {
    const data = unwrap(await client()
      .from('campaign_registry')
      .select('campaign_id,generated_at,generated_by,action,note,full_id')
      .order('generated_at', { ascending: false })
      .limit(20));
    return data || [];
  }

  async function generateCampaign(username, dateStamp, campaignName) {
    const data = unwrap(await client().rpc('generate_campaign_id', {
      p_generated_by: username,
      p_date_stamp: dateStamp,
      p_campaign_name: campaignName
    }));
    return Array.isArray(data) ? data[0] : data;
  }

  async function backCampaign(username) {
    const data = unwrap(await client().rpc('back_campaign_id', {
      p_generated_by: username
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

  function subscribeCounter(onChange) {
    const channel = client()
      .channel('campaign-counter-sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaign_counter'
      }, (payload) => {
        const value = payload.new?.current_value;
        if (typeof value === 'number') onChange(value);
      })
      .subscribe();
    return () => client().removeChannel(channel);
  }

  function subscribeActivity(onInsert) {
    const channel = client()
      .channel('campaign-activity-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campaign_registry'
      }, (payload) => {
        onInsert(payload.new);
      })
      .subscribe();
    return () => client().removeChannel(channel);
  }

  async function saveFolderScan(scannedBy, folderName, entries) {
    const data = unwrap(await client().rpc('save_folder_scan', {
      p_scanned_by: scannedBy,
      p_folder_name: folderName,
      p_entries: entries
    }));
    return data;
  }

  async function loadFolderScans() {
    try {
      const data = unwrap(await client()
        .from('campaign_folder_scans')
        .select('campaign_id, campaign_name, folder_date, manager')
        .order('scanned_at', { ascending: false }));
      return data || [];
    } catch (err) {
      // Table may not exist yet (SQL migration pending)
      return [];
    }
  }

  async function clearFolderScans(scannedBy) {
    const result = unwrap(await client()
      .from('campaign_folder_scans')
      .delete()
      .eq('scanned_by', scannedBy));
    return result;
  }

  return {
    checkConnection,
    loadLastCampaign,
    loadCounter,
    loadRecentActivity,
    generateCampaign,
    backCampaign,
    setNextCampaignId,
    subscribeCounter,
    subscribeActivity,
    saveFolderScan,
    loadFolderScans,
    clearFolderScans
  };
});