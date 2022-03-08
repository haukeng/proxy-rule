// Developed by Hackl0us (https://github.com/hackl0us)
// Modified by Haukeng (https://github.com/haukeng)

const title = "⚠️ Token didn't existed!";
const subtitle = "";
const message =
  "Please visiting  https://aqicn.org/data-platform/token/ to register and enable the token.js.";
const aqicnToken = $prefs.valueForKey("waqi_token");

const AirQualityStandard = {
  CN: "HJ6332012.2201",
  US: "EPA_NowCast.2201",
};

const AirQualityLevel = {
  GOOD: 1,
  MODERATE: 2,
  UNHEALTHY_FOR_SENSITIVE: 3,
  UNHEALTHY: 4,
  VERY_UNHEALTHY: 5,
  HAZARDOUS: 6,
};

const coordRegex =
  /https:\/\/weather-data\.apple\.com\/v2\/weather\/([\w-]+)\/([0-9]+\.[0-9]+)\/([0-9]+\.[0-9]+)\?/;
const [_, lang, lat, lng] = $request.url.match(coordRegex);

function classifyAirQualityLevel(aqiIndex) {
  if (aqiIndex >= 0 && aqiIndex <= 50) {
    return AirQualityLevel.GOOD;
  } else if (aqiIndex >= 51 && aqiIndex <= 100) {
    return AirQualityLevel.MODERATE;
  } else if (aqiIndex >= 101 && aqiIndex <= 150) {
    return AirQualityLevel.UNHEALTHY_FOR_SENSITIVE;
  } else if (aqiIndex >= 151 && aqiIndex <= 200) {
    return AirQualityLevel.UNHEALTHY;
  } else if (aqiIndex >= 201 && aqiIndex <= 300) {
    return AirQualityLevel.VERY_UNHEALTHY;
  } else if (aqiIndex >= 301) {
    return AirQualityLevel.HAZARDOUS;
  }
}

function modifyWeatherResp(weatherRespBody, aqicnRespBody) {
  let weatherRespJson = JSON.parse(weatherRespBody);
  let aqicnRespJson = JSON.parse(aqicnRespBody).data;
  weatherRespJson.airQuality = constructAirQuailityNode(aqicnRespJson);
  return JSON.stringify(weatherRespJson);
}

function getPrimaryPollutant(pollutant) {
  switch (pollutant) {
    case "co":
      return "CO2";
    case "so2":
      return "SO2";
    case "no2":
      return "NO2";
    case "nox":
      return "NOX";
    case "pm25":
      return "PM2.5";
    case "pm10":
      return "PM10";
    case "o3":
      return "OZONE";
    default:
      return "OTHER";
  }
}

function constructAirQuailityNode(aqicnData) {
  let airQualityNode = {
    index: 0,
    scale: "",
    metadata: {
      version: 2,
      longitude: 0,
      providerLogo:
        "https://raw.githubusercontent.com/haukeng/proxy-rule/main/quanx/img/waqi-logo.png",
      providerName: "The World Air Quality Project",
      expireTime: "",
      language: "en-US",
      latitude: 0,
      reportedTime: "",
      readTime: "",
      units: "m",
    },
    pollutants: {
      CO: { name: "CO", amount: 0, unit: "microgramsPerM3" },
      NO: { name: "NO", amount: 0, unit: "microgramsPerM3" },
      NO2: { name: "NO2", amount: 0, unit: "microgramsPerM3" },
      SO2: { name: "SO2", amount: 0, unit: "microgramsPerM3" },
      OZONE: { name: "OZONE", amount: 0, unit: "microgramsPerM3" },
      NOX: { name: "NOX", amount: 0, unit: "microgramsPerM3" },
      PM10: { name: "PM10", amount: 0, unit: "microgramsPerM3" },
      "PM2.5": { name: "PM2.5", amount: 0, unit: "microgramsPerM3" },
    },
    sourceType: "station",
    source: "",
    previousDayComparison: "unknown",
    learnMoreURL: "",
    isSignificant: true,
    primaryPollutant: "",
    name: "AirQuality",
    categoryIndex: 1,
  };

  airQualityNode.index = aqicnData.aqi;
  airQualityNode.source = aqicnData.city.name;
  airQualityNode.scale = AirQualityStandard.US;
  airQualityNode.learnMoreURL = getLearnMoreURL(aqicnData.city.url);
  airQualityNode.categoryIndex = classifyAirQualityLevel(aqicnData.aqi);
  airQualityNode.primaryPollutant = getPrimaryPollutant(aqicnData.dominentpol);

  airQualityNode.metadata.latitude = aqicnData.city.geo[0];
  airQualityNode.metadata.longitude = aqicnData.city.geo[1];
  airQualityNode.metadata.readTime = timeConversion(new Date(), "remain");
  airQualityNode.metadata.reportedTime = timeConversion(
    new Date(aqicnData.time.iso),
    "remain"
  );
  airQualityNode.metadata.expireTime = timeConversion(
    new Date(aqicnData.time.iso),
    "add-1h-floor"
  );
  airQualityNode.metadata.language = parseLanguage(lang);

  airQualityNode.pollutants.CO.amount = aqicnData.iaqi.co?.v || -1;
  airQualityNode.pollutants.SO2.amount = aqicnData.iaqi.so2?.v || -1;
  airQualityNode.pollutants.NO2.amount = aqicnData.iaqi.no2?.v || -1;
  airQualityNode.pollutants.NOX.amount = aqicnData.iaqi.nox?.v || -1;
  airQualityNode.pollutants["PM2.5"].amount = aqicnData.iaqi.pm25?.v || -1;
  airQualityNode.pollutants.OZONE.amount = aqicnData.iaqi.o3?.v || -1;
  airQualityNode.pollutants.PM10.amount = aqicnData.iaqi.pm10?.v || -1;

  return airQualityNode;
}

function getLearnMoreURL(url) {
  if (lang.includes("zh-CN")) {
    return url + "/cn/m";
  } else {
    return url + "/m";
  }
}

function timeConversion(time, method) {
  switch (method) {
    case "remain":
      time.setMilliseconds(0);
      break;
    case "add-1h-floor":
      time.setHours(time.getHours() + 1);
      time.setMinutes(0, 0, 0);
      break;
    default:
      console.log("Error time converting action.");
  }
  return time.toISOString().split(".")[0] + "Z";
}

function parseLanguage(lang) {
  if (lang.match(/_.*?$/)) {
    return lang.replace(/_.*?$/, "");
  } else {
    return lang;
  }
}

const aqicnRequest = {
  url: `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${aqicnToken}`,
};

if (aqicnToken) {
  $task.fetch(aqicnRequest).then(
    (response) => {
      let body = modifyWeatherResp($response.body, response.body);
      $done({ body });
    },
    (reason) => {
      let body = $response.body;
      $done({ body });
    }
  );
} else {
  let body = $response.body;
  $notify(title, subtitle, message);
  $done({ body });
}
