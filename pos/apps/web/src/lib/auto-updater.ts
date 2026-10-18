/**
 * RetailFlow Unified Auto-Updater Service
 * Seamlessly manages continuous updates across both Windows Desktop (Tauri EXE)
 * and Web Browser (Cloudflare Pages / PWA).
 */

export interface UpdateInfo {
  isDesktop: boolean;
  currentVersion: string;
  availableVersion?: string;
  shouldUpdate: boolean;
  releaseNotes?: string;
  pubDate?: string;
}

export type UpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready-to-restart"
  | "up-to-date"
  | "error";

export class AutoUpdaterService {
  private static instance: AutoUpdaterService;
  private currentVersion = "1.0.0";
  private checkInterval: any = null;
  private listeners: Set<(phase: UpdatePhase, info: UpdateInfo | null, error?: string) => void> = new Set();
  
  public currentPhase: UpdatePhase = "idle";
  public latestUpdate: UpdateInfo | null = null;
  public errorMessage: string | null = null;
  public downloadProgress = 0;

  private constructor() {
    if (typeof window !== "undefined") {
      this.currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
    }
  }

  public static getInstance(): AutoUpdaterService {
    if (!AutoUpdaterService.instance) {
      AutoUpdaterService.instance = new AutoUpdaterService();
    }
    return AutoUpdaterService.instance;
  }

  public isDesktop(): boolean {
    return typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_METADATA__" in window);
  }

  public getVersion(): string {
    return this.currentVersion;
  }

  public subscribe(listener: (phase: UpdatePhase, info: UpdateInfo | null, error?: string) => void) {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.currentPhase, this.latestUpdate, this.errorMessage || undefined);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(phase: UpdatePhase, info: UpdateInfo | null, error?: string) {
    this.currentPhase = phase;
    this.latestUpdate = info;
    this.errorMessage = error || null;
    this.listeners.forEach((fn) => fn(phase, info, error));
  }

  /**
   * Main Check for Updates entry point
   */
  public async checkForUpdate(manualTrigger = false): Promise<UpdateInfo> {
    this.notify("checking", null);

    try {
      if (this.isDesktop()) {
        return await this.checkDesktopTauriUpdate();
      } else {
        return await this.checkWebUpdate();
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to check for updates.";
      console.warn("[AutoUpdater] Update check failed:", msg);
      this.notify("error", null, msg);
      return {
        isDesktop: this.isDesktop(),
        currentVersion: this.currentVersion,
        shouldUpdate: false,
      };
    }
  }

  /**
   * Check Windows Desktop Tauri Native Updater
   */
  private async checkDesktopTauriUpdate(): Promise<UpdateInfo> {
    try {
      const { checkUpdate } = await import("@tauri-apps/api/updater");
      const res = await checkUpdate();

      if (res.shouldUpdate && res.manifest) {
        const info: UpdateInfo = {
          isDesktop: true,
          currentVersion: this.currentVersion,
          availableVersion: res.manifest.version,
          shouldUpdate: true,
          releaseNotes: res.manifest.body || "New features and performance improvements.",
          pubDate: res.manifest.date,
        };
        this.notify("available", info);
        return info;
      } else {
        const info: UpdateInfo = {
          isDesktop: true,
          currentVersion: this.currentVersion,
          shouldUpdate: false,
        };
        this.notify("up-to-date", info);
        return info;
      }
    } catch (err: any) {
      // In development or when updater endpoint is unreachable
      console.info("[AutoUpdater] Desktop updater offline/dev fallback:", err?.message);
      const info: UpdateInfo = {
        isDesktop: true,
        currentVersion: this.currentVersion,
        shouldUpdate: false,
      };
      this.notify("up-to-date", info);
      return info;
    }
  }

  /**
   * Check Web App Continuous Deployment updates via /api/version
   */
  private async checkWebUpdate(): Promise<UpdateInfo> {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      const remoteVersion = data.version || "1.0.0";
      const remoteBuild = data.buildTime;
      const cachedBuild = typeof window !== "undefined" ? localStorage.getItem("retailflow_build_time") : null;

      // Check if version is newer or build timestamp changed
      const isNewer =
        (cachedBuild && remoteBuild && cachedBuild !== remoteBuild) ||
        this.isVersionNewer(remoteVersion, this.currentVersion);

      if (isNewer) {
        const info: UpdateInfo = {
          isDesktop: false,
          currentVersion: this.currentVersion,
          availableVersion: remoteVersion,
          shouldUpdate: true,
          releaseNotes: data.releaseNotes || "New enhancements and bug fixes available.",
          pubDate: remoteBuild,
        };
        this.notify("available", info);
        return info;
      } else {
        if (remoteBuild && typeof window !== "undefined") {
          localStorage.setItem("retailflow_build_time", remoteBuild);
        }
        const info: UpdateInfo = {
          isDesktop: false,
          currentVersion: this.currentVersion,
          shouldUpdate: false,
        };
        this.notify("up-to-date", info);
        return info;
      }
    } catch (err: any) {
      const info: UpdateInfo = {
        isDesktop: false,
        currentVersion: this.currentVersion,
        shouldUpdate: false,
      };
      this.notify("up-to-date", info);
      return info;
    }
  }

  /**
   * Installs Desktop update and prompts relaunch
   */
  public async installDesktopUpdate(): Promise<void> {
    if (!this.isDesktop()) {
      window.location.reload();
      return;
    }

    this.notify("downloading", this.latestUpdate);
    this.downloadProgress = 10;

    try {
      const { installUpdate, onUpdaterEvent } = await import("@tauri-apps/api/updater");

      // Listen for download progress
      const unlisten = await onUpdaterEvent(({ error, status }) => {
        if (error) {
          this.notify("error", this.latestUpdate, error);
        } else if (status === "DONE") {
          this.downloadProgress = 100;
          this.notify("ready-to-restart", this.latestUpdate);
        } else if (status === "PENDING") {
          this.downloadProgress = Math.min(this.downloadProgress + 20, 90);
        }
      });

      await installUpdate();
      unlisten();
    } catch (err: any) {
      this.notify("error", this.latestUpdate, err?.message || "Failed to install desktop update.");
      throw err;
    }
  }

  /**
   * Applies Web update by busting cache and refreshing window
   */
  public applyWebUpdate(): void {
    if (typeof window !== "undefined") {
      if (this.latestUpdate?.pubDate) {
        localStorage.setItem("retailflow_build_time", this.latestUpdate.pubDate);
      }
      window.location.reload();
    }
  }

  /**
   * Starts non-intrusive periodic update checks (every 5 minutes)
   */
  public startPeriodicChecks(intervalMs = 5 * 60 * 1000): void {
    if (this.checkInterval) return;
    
    // Initial check delayed by 4 seconds so POS startup is instantaneous
    setTimeout(() => {
      this.checkForUpdate(false).catch(() => {});
    }, 4000);

    this.checkInterval = setInterval(() => {
      this.checkForUpdate(false).catch(() => {});
    }, intervalMs);
  }

  public stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private isVersionNewer(remote: string, current: string): boolean {
    const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
    const [rMaj = 0, rMin = 0, rPat = 0] = parse(remote);
    const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);

    if (rMaj > cMaj) return true;
    if (rMaj === cMaj && rMin > cMin) return true;
    if (rMaj === cMaj && rMin === cMin && rPat > cPat) return true;
    return false;
  }
}

export const autoUpdater = AutoUpdaterService.getInstance();
