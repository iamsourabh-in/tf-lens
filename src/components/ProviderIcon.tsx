interface ProviderIconProps {
  provider: string;
  type: string;
  className?: string;
}

export function ProviderIcon({ provider, type, className = '' }: ProviderIconProps) {
  const p = provider.toLowerCase();
  const t = type.toLowerCase();

  // AWS resources (aws_* prefix or hashicorp/aws provider)
  if (p.includes('aws') || t.startsWith('aws_')) {
    return (
      <svg
        className={`provider-icon aws ${className}`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        style={{ flexShrink: 0 }}
      >
        <title>Amazon Web Services</title>
        <rect x="2" y="5" width="20" height="4" rx="1" fill="#FF9900" />
        <rect x="2" y="12" width="20" height="4" rx="1" fill="#FF9900" />
        <rect x="2" y="19" width="20" height="4" rx="1" fill="#FF9900" />
        <circle cx="6" cy="7" r="1" fill="#FFF" />
        <circle cx="6" cy="14" r="1" fill="#FFF" />
        <circle cx="6" cy="21" r="1" fill="#FFF" />
      </svg>
    );
  }

  // Azure resources (azurerm_* prefix or hashicorp/azurerm provider)
  if (p.includes('azure') || t.startsWith('azurerm_')) {
    return (
      <svg
        className={`provider-icon azure ${className}`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        style={{ flexShrink: 0 }}
      >
        <title>Microsoft Azure</title>
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#0089D6" opacity="0.85" />
        <path d="M12 2v20M2 7l10 5 10-5" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // GCP resources (google_* prefix or hashicorp/google provider)
  if (p.includes('google') || p.includes('gcp') || t.startsWith('google_')) {
    return (
      <svg
        className={`provider-icon gcp ${className}`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        style={{ flexShrink: 0 }}
      >
        <title>Google Cloud Platform</title>
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="none" stroke="#4285F4" strokeWidth="1.5" />
        <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#ea4335" />
        <path d="M3 7v10l9 5V12L3 7z" fill="#4285F4" />
        <path d="M21 7v10l-9 5V12l9-5z" fill="#fabc05" />
      </svg>
    );
  }

  // Kind Cluster or Kubernetes/Helm resources (kind_*, kubernetes_*, helm_*)
  if (
    p.includes('kind') ||
    p.includes('kubernetes') ||
    p.includes('k8s') ||
    p.includes('helm') ||
    t.startsWith('kind_') ||
    t.startsWith('kubernetes_') ||
    t.startsWith('helm_')
  ) {
    return (
      <svg
        className={`provider-icon kubernetes ${className}`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="#326CE5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <title>Kubernetes / Kind Cluster</title>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20M5.8 5.8l12.4 12.4M18.2 5.8L5.8 18.2" />
        <circle cx="12" cy="12" r="3" fill="#326CE5" />
      </svg>
    );
  }

  // Local/Archive/Null provider resources (local_*, archive_*, null_*)
  if (
    p.includes('local') ||
    t.startsWith('local_') ||
    p.includes('archive') ||
    t.startsWith('archive_') ||
    p.includes('null') ||
    t.startsWith('null_')
  ) {
    return (
      <svg
        className={`provider-icon local ${className}`}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="#6b7280"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <title>Local / System Resource</title>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M21 12H3M12 3v18" />
      </svg>
    );
  }

  // Generic/Other Terraform provider resources
  return (
    <svg
      className={`provider-icon default ${className}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="#844FBA"
      style={{ flexShrink: 0 }}
    >
      <title>Terraform Resource</title>
      <path d="M2 6l5-3 5 3-5 3-5-3zm10 0l5-3 5 3-5 3-5-3zm-5 6l5-3 5 3-5 3-5-3zm10 0l5-3 5 3-5 3-5-3zm-5 6l5-3 5 3-5 3-5-3z" />
    </svg>
  );
}
