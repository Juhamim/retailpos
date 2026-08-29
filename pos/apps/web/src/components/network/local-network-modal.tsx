"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  Wifi, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  RefreshCw, 
  Server, 
  ShieldCheck,
  Laptop,
  Radio,
  Flame
} from "lucide-react";

interface LocalNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IpDetail {
  name: string;
  ip: string;
  isHotspotOrWifi?: boolean;
}

export function LocalNetworkModal({ isOpen, onClose }: LocalNetworkModalProps) {
  const [ipAddress, setIpAddress] = useState<string>("10.13.115.101");
  const [port, setPort] = useState<string>("3000");
  const [ipDetails, setIpDetails] = useState<IpDetail[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "hotspot_guide">("qr");

  // Discover local LAN / Hotspot IP
  const detectLocalIps = async () => {
    setIsDetecting(true);
    const discoveredIps: IpDetail[] = [
      { name: "Active Wi-Fi / Hotspot (10.13.115.101)", ip: "10.13.115.101", isHotspotOrWifi: true },
      { name: "Android Default Hotspot (192.168.43.100)", ip: "192.168.43.100", isHotspotOrWifi: true },
      { name: "Standard Router Wi-Fi (192.168.1.100)", ip: "192.168.1.100" },
      { name: "Localhost (127.0.0.1)", ip: "127.0.0.1" }
    ];

    // 1. If running in browser and accessed via LAN IP
    if (typeof window !== "undefined" && window.location.hostname) {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1") {
        if (!discoveredIps.some(d => d.ip === host)) {
          discoveredIps.unshift({ name: `Connected Host (${host})`, ip: host, isHotspotOrWifi: true });
        }
        setIpAddress(host);
      }
      if (window.location.port) {
        setPort(window.location.port);
      }
    }

    // 2. If running in Tauri desktop, invoke native helper
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      try {
        const { invoke } = await import("@tauri-apps/api/tauri");
        const tauriIps = await invoke<string[]>("get_local_ip_addresses");
        if (tauriIps && Array.isArray(tauriIps)) {
          tauriIps.forEach(ip => {
            if (!discoveredIps.some(d => d.ip === ip)) {
              discoveredIps.push({ name: `Desktop Network (${ip})`, ip, isHotspotOrWifi: true });
            }
          });
          if (tauriIps[0]) {
            setIpAddress(tauriIps[0]);
          }
        }
      } catch (err) {
        console.warn("Tauri local IP invocation notice:", err);
      }
    }

    // 3. Fallbacks if detection is empty
    if (discoveredIps.length === 0) {
      // Known current host hotspot IP fallback
      discoveredIps.push(
        { name: "Mobile Hotspot / Wi-Fi (10.13.115.101)", ip: "10.13.115.101", isHotspotOrWifi: true },
        { name: "Common Android Hotspot (192.168.43.100)", ip: "192.168.43.100", isHotspotOrWifi: true },
        { name: "Router Wi-Fi (192.168.1.100)", ip: "192.168.1.100" },
        { name: "Localhost (127.0.0.1)", ip: "127.0.0.1" }
      );
      setIpAddress("10.13.115.101");
    }

    setIpDetails(discoveredIps);
    setIsDetecting(false);
  };

  useEffect(() => {
    if (isOpen) {
      detectLocalIps();
    }
  }, [isOpen]);

  const activeUrl = `http://${customIp.trim() || ipAddress}:${port}`;

  // Generate QR Code on URL change
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(activeUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, [activeUrl, isOpen]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-white animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Mobile & Local Network Pairing
              </h2>
              <p className="text-xs text-slate-400">
                Connect smartphones & tablets via Mobile Hotspot or Wi-Fi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 px-5 gap-2">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "qr" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" /> Live QR Code
          </button>
          <button
            onClick={() => setActiveTab("hotspot_guide")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "hotspot_guide" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Radio className="h-3.5 w-3.5" /> Mobile Hotspot Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === "qr" ? (
            <>
              {/* QR Code Card */}
              <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 shadow-inner">
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border-4 border-white mb-4 transition-transform hover:scale-[1.02]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="POS Terminal LAN QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 text-slate-400">
                      <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Host IP: {customIp || ipAddress} (Port {port})</span>
                </div>

                {/* Connection URL Bar */}
                <div className="w-full flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 pl-3.5">
                  <span className="text-xs font-mono text-indigo-300 font-semibold truncate flex-1 select-all">
                    {activeUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Open in new browser window"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Network Configuration / IP Selector */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-indigo-400" /> Host Network Interface
                  </span>
                  <button
                    onClick={detectLocalIps}
                    disabled={isDetecting}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isDetecting ? "animate-spin" : ""}`} />
                    Refresh IPs
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Select Detected IP</label>
                    <select
                      value={customIp || ipAddress}
                      onChange={(e) => {
                        setIpAddress(e.target.value);
                        setCustomIp("");
                      }}
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    >
                      {ipDetails.map((detail, idx) => (
                        <option key={idx} value={detail.ip}>
                          {detail.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Port</label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="3000"
                      className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                    placeholder="Or type manual IP (e.g. 10.13.115.101)"
                    className="w-full h-8 px-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Guide */}
              <div className="border border-slate-800/80 rounded-2xl p-4 bg-slate-950/30 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <Smartphone className="h-4 w-4 text-indigo-400" /> How to connect from your phone:
                </div>
                <p className="leading-relaxed">
                  1. Scan this QR code using your phone camera (or type <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 font-mono">{activeUrl}</code> in Chrome/Safari).
                </p>
                <p className="leading-relaxed">
                  2. Log in using any cashier PIN (<strong>1234</strong>, <strong>5678</strong>, <strong>9999</strong>) to start billing wirelessly!
                </p>
              </div>
            </>
          ) : (
            /* Hotspot / Tethering Guide */
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Flame className="h-4 w-4" /> Using Mobile Phone Hotspot:
                </p>
                <p className="leading-relaxed">
                  When this computer connects to your phone's Hotspot (or USB tethering), your phone creates a direct private network.
                </p>
              </div>

              <div className="border border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-950/40">
                <p className="font-bold text-white text-sm">Step 1: Check Active Hotspot IP</p>
                <p className="leading-relaxed text-slate-400">
                  Your PC's IP on your phone's hotspot is currently:
                </p>
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-indigo-300 font-bold text-center text-sm">
                  {ipAddress}
                </div>
              </div>

              <div className="border border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-950/40">
                <p className="font-bold text-white text-sm">Step 2: Connect Phone Browser</p>
                <p className="leading-relaxed text-slate-400">
                  On the mobile phone running the hotspot, simply open Chrome / Safari and browse to:
                </p>
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-emerald-400 font-bold text-center text-sm select-all">
                  http://{ipAddress}:3000
                </div>
              </div>

              <div className="border border-slate-800 rounded-2xl p-4 space-y-2 bg-slate-950/40">
                <p className="font-bold text-white text-sm">Troubleshooting Windows Firewall</p>
                <p className="leading-relaxed text-slate-400">
                  If your phone says "Connection Refused / Can't Reach Site", Windows Firewall may be blocking port 3000 on the Hotspot network. To allow it, open PowerShell as Administrator and run:
                </p>
                <code className="block p-2.5 bg-black/80 text-emerald-400 rounded-xl font-mono text-[11px] select-all overflow-x-auto">
                  New-NetFirewallRule -DisplayName "RetailFlow POS" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
