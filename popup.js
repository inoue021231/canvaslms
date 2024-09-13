function convertFullWidthBracketsToHalfWidth(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    switch (charCode) {
      case 0xFF08: // 全角「（」
        result += '(';
        break;
      case 0xFF09: // 全角「）」
        result += ')';
        break;
      default:
        result += text[i];
    }
  }
  return result;
}

function convertFullWidthToHalfWidthNumber(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode >= 0xFF10 && charCode <= 0xFF19) {
      result += String.fromCharCode(charCode - 0xFEE0); // 全角数字を半角数字に変換
    } else {
      result += text[i];
    }
  }
  return result;
}

function convertHalfWidthToFullWidth(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    switch (charCode) {
      case 0x28: // 半角左括弧 '('
        result += String.fromCharCode(0xFF08); // 全角左括弧 '（'
        break;
      case 0x29: // 半角右括弧 ')'
        result += String.fromCharCode(0xFF09); // 全角右括弧 '）'
        break;
      case 0x30: // 半角数字 '0'
        result += String.fromCharCode(charCode + 0xFEE0); // 全角数字 '０'
        break;
      case 0x31: // 半角数字 '1'
      case 0x32: // 半角数字 '2'
      case 0x33: // 半角数字 '3'
      case 0x34: // 半角数字 '4'
      case 0x35: // 半角数字 '5'
      case 0x36: // 半角数字 '6'
      case 0x37: // 半角数字 '7'
      case 0x38: // 半角数字 '8'
      case 0x39: // 半角数字 '9'
        result += String.fromCharCode(charCode + 0xFEE0); // 全角数字 '１' 〜 '９'
        break;
      default:
        result += text[i];
    }
  }
  return result;
}

document.getElementById('save').addEventListener('click', () => {
  const token = document.getElementById('token').value;
  if (token) {

    chrome.runtime.sendMessage({ type: "getByAPI", apiToken: token }, (response) => {
      if (response.success) {
        chrome.runtime.sendMessage({ type: "getData" }, (storageResponse) => {
          const data = storageResponse.data ?? [];
          
          response.data.forEach((item) => {
            const input = item.name;
            const id = item.id;

            let newInput = convertFullWidthBracketsToHalfWidth(input);
            newInput = convertFullWidthToHalfWidthNumber(newInput);

            const subjectMatch = newInput.match(/2024(.*?)\([^()]*\)[^()]*$/);

            const timeMatch = newInput.match(/(.{4})\)$/);

            if (subjectMatch && timeMatch) {
              let subject = subjectMatch[1].trim();
              let time = timeMatch[1].trim();
              subject = convertHalfWidthToFullWidth(subject);
              time = convertHalfWidthToFullWidth(time);
              const targetUrl = `https://syllabus.chs.nihon-u.ac.jp/op/search.html?gakubu=1&kamokumei=${subject}&teacher=&keyword=`;
              chrome.runtime.sendMessage({ 
                type: "fetchPage",
                url: targetUrl 
              }, (targetPageResponse) => {
                if (targetPageResponse.success) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(targetPageResponse.data, "text/html");

                  const xpath = '/html/body/div[1]/div[4]/div[2]/div/table/tbody/tr/td[1]/a';
                  const element = doc.evaluate(
                    xpath,
                    doc,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                  ).singleNodeValue;

                  if (element) {
                    let href = element.getAttribute('href');
                    if (href && !href.startsWith('http')) {
                      href = new URL(href, targetUrl).href;
                    }

                    if (href) {
                      chrome.runtime.sendMessage({ 
                        type: "fetchPage",
                        url: href 
                      }, (newPageResponse) => {
                        if (newPageResponse.success) {
                          const newDoc = parser.parseFromString(newPageResponse.data, "text/html");

                          for (let i = 2; i <= 16; i++) {
                            const contentXpath = `/html/body/div[1]/div[4]/div[2]/div/table[3]/tbody/tr[${i}]/td[2]`;
                            const contentElement = newDoc.evaluate(
                              contentXpath,
                              newDoc,
                              null,
                              XPathResult.FIRST_ORDERED_NODE_TYPE,
                              null
                            ).singleNodeValue;

                            if (contentElement) {
                              let lastText = contentElement.textContent.trim().split('\n').filter(text => text.trim()).pop().replace(/\s+/g, '');
                              if (lastText.includes('【授業形態】')) {
                                lastText = lastText.replace('【授業形態】', '');
                              } else {
                                lastText = '不明';
                              }

                              const index = data.length !== 0 ? data.findIndex((item) => item.subject === subject) : -1;
                              if (index !== -1) {
                                data[index].type[i-1] = lastText;
                              } else {
                                data.push({
                                  syllabusLink: href,
                                  subject,
                                  type: {[i-1]: lastText},
                                  time,
                                  id
                                });
                              }
                            } else {
                              console.error(`Content element not found for XPath: ${contentXpath}`);
                            }
                          }
                          console.log(data);
                          chrome.storage.sync.set({ data });
                        } else {
                          console.error("Error fetching new page:", newPageResponse.error);
                        }
                      });
                    }
                  } else {
                    console.error("Element not found for XPath:", xpath);
                  }
                } else {
                  console.error("Error fetching target URL:", targetPageResponse.error);
                }
              });
            } else {
              console.log('Match not found');
            }
          });
        });

      } else {
        console.warn('Failed to retrieve data via API.');
      }
    });

    chrome.storage.sync.set({ apiToken: token }, () => {
      alert('Token saved!');
    });
  }
});