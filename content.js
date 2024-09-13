function createButton(label, url, bgColor) {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.padding = '10px 20px';
  button.style.width = '100px';
  button.style.height = '40px';
  button.style.marginLeft = '10px';
  button.style.backgroundColor = bgColor;
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  button.style.fontSize = '14px';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.textAlign = 'center';
  button.style.lineHeight = '20px';
  button.style.zIndex = '1000'; // z-indexを設定

  // マウスオーバー時のインタラクション
  button.addEventListener('mouseover', () => {
    button.style.filter = 'brightness(1.2)'; // 明るさを上げる
  });

  button.addEventListener('mouseout', () => {
    button.style.filter = 'brightness(1)'; // 元に戻す
  });

  button.addEventListener('click', () => {
    window.open(url, '_blank');
  });

  return button;
}

function createNextClassInfo(label) {
  const info = document.createElement('div');
  info.textContent = `次回は${label}`;
  info.style.position = 'fixed';
  info.style.top = '10px';
  info.style.right = '370px'; // ボタンより左側に表示
  info.style.padding = '10px';
  info.style.backgroundColor = '#fff';
  info.style.color = '#333';
  info.style.border = '1px solid #ccc';
  info.style.borderRadius = '5px';
  info.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  info.style.fontSize = '14px';
  info.style.fontFamily = 'Arial, sans-serif';
  info.style.zIndex = '1000'; // z-indexを設定
  return info;
}

const scheduleData = {
  "monday": {
    "firstPeriod": [
      "0415", "0422", "0506", "0513", "0520",
      "0527", "0603", "0610", "0617", "0624",
      "0701", "0708", "0715", "0722", "0729"
    ],
    "secondPeriod": [
      "0923", "0930", "1007", "1014", "1021",
      "1028", "1111", "1118", "1125", "1202",
      "1209", "1216", "1223", "0120", "0127"
    ]
  },
  "tuesday": {
    "firstPeriod": [
      "0416", "0423", "0507", "0514", "0521",
      "0528", "0604", "0611", "0618", "0625",
      "0702", "0709", "0716", "0723", "0730"
    ],
    "secondPeriod": [
      "0924", "1001", "1008", "1015", "1022",
      "1029", "1112", "1119", "1126", "1203",
      "1210", "1217", "1224", "0114", "0121"
    ]
  },
  "wednesday": {
    "firstPeriod": [
      "0410", "0417", "0424", "0508", "0515",
      "0522", "0529", "0605", "0612", "0619",
      "0626", "0703", "0710", "0717", "0724"
    ],
    "secondPeriod": [
      "0925", "1002", "1009", "1016", "1023",
      "1030", "1106", "1113", "1120", "1127",
      "1204", "1211", "1218", "0115", "0122"
    ]
  },
  "thursday": {
    "firstPeriod": [
      "0411", "0418", "0425", "0509", "0516",
      "0523", "0530", "0606", "0613", "0620",
      "0627", "0704", "0711", "0718", "0725"
    ],
    "secondPeriod": [
      "0926", "1003", "1010", "1017", "1024",
      "1031", "1107", "1114", "1121", "1128",
      "1205", "1212", "1219", "0116", "0123"
    ]
  },
  "friday": {
    "firstPeriod": [
      "0412", "0419", "0426", "0510", "0517",
      "0524", "0531", "0607", "0614", "0621",
      "0628", "0705", "0712", "0719", "0726"
    ],
    "secondPeriod": [
      "0920", "0927", "1011", "1018", "1025",
      "1101", "1108", "1115", "1122", "1129",
      "1206", "1213", "1220", "0110", "0124"
    ]
  }
};

function getScheduleForTime(time) {
  const periodType = time[0] === '後' ? 'firstPeriod' : 'secondPeriod';
  const dayOfWeek = time[2];
  const dayKey = getDayKey(dayOfWeek);

  const today = new Date();
  const currentYear = today.getFullYear();
  const schedule = scheduleData[dayKey][periodType];
  const nextClassIndex = schedule.findIndex(date => {
    const fullDate = new Date(`${currentYear}-${date.slice(0, 2)}-${date.slice(2, 4)}`);
    return fullDate > today;
  });

  return { nextClassIndex, schedule };
}

function getDayKey(dayOfWeek) {
  switch (dayOfWeek) {
    case '月': return 'monday';
    case '火': return 'tuesday';
    case '水': return 'wednesday';
    case '木': return 'thursday';
    case '金': return 'friday';
    default: return 'friday';
  }
}

const url = window.location.href;
let courseId, syllabusLink = 'https://syllabus.chs.nihon-u.ac.jp/';

const match = url.match(/courses\/(\d+)/);
if (match && match[1]) {
  courseId = match[1];
}

chrome.runtime.sendMessage({ type: "getData" }, (storageResponse) => {
  const data = storageResponse.data ?? [];
  const d = data.find(item => String(item.id) === String(courseId));
  if (d && d.syllabusLink) {
    syllabusLink = d.syllabusLink;
    const time = d.time;
    const typeData = d.type;
    const schedule = getScheduleForTime(time);
    const nextClassType = typeData[schedule.nextClassIndex + 1];
    if(schedule?.nextClassIndex !== -1) {
      const nextClassInfo = createNextClassInfo(nextClassType);
      document.body.appendChild(nextClassInfo);
    }
    const syllabusButton = createButton('シラバス', syllabusLink, '#9fd237');
    document.body.appendChild(syllabusButton);

    const portalButton = createButton('ポータル', 'https://portal.educ.chs.nihon-u.ac.jp/', '#3e7d5a');
    portalButton.style.right = '130px';
    document.body.appendChild(portalButton);

    const slackButton = createButton('Slack', 'https://app.slack.com/client', '#8b608f');
    slackButton.style.right = '250px';
    document.body.appendChild(slackButton);
  }
});

