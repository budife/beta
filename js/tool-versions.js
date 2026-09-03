/**
 * Tool Version Registry
 * Keeps each eDM Helper tool on its own release line.
 */

const TOOL_VERSIONS = {
  core: {
    label: 'Core',
    version: '6.16.14',
    status: 'stable'
  },
  home: {
    label: 'Home',
    version: '1.0.1',
    status: 'stable'
  },
  bookmarklet: {
    label: 'Bookmarklet',
    version: '1.3.1',
    status: 'stable'
  },
  'campaign-counter': {
    label: 'Campaign Counter',
    version: '1.6.5',
    status: 'stable'
  },
  'config-edm': {
    label: 'Config eDM',
    version: '1.6.1',
    status: 'stable'
  },

  'doc-to-html': {
    label: 'Doc to HTML',
    version: '1.2.0',
    status: 'stable'
  },
  'layout-checker': {
    label: 'Layout Checker',
    version: '2.1.7',
    status: 'stable'
  },
  'layout-slicer': {
    label: 'Layout Slicer',
    version: '0.5.3',
    status: 'stable'
  },
  'tnc-uploader': {
    label: 'TNC Uploader',
    version: '0.3.9',
    status: 'stable'
  },
  'wfh-tracker': {
    label: 'WFH Tracker',
    version: '1.2.0',
    status: 'stable'
  },
  docs: {
    label: 'Documentation',
    version: '1.0.2',
    status: 'stable'
  },
  maintenance: {
    label: 'Maintenance',
    version: '1.0.2',
    status: 'stable'
  }
};

function getToolVersion(key) {
  return TOOL_VERSIONS[key] || null;
}
