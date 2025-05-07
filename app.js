const generateBtn = document.getElementById("generateBtn");
const textInput = document.getElementById("txtArea");
const imgContainer = document.getElementById("imgShell");
const imgName = document.getElementById("imgName");
const imgSizeMap = [150,200,250];
var generated = false;
var tab = "home";
var textToGenerate = "";
let historyList = []; 
let qrcode = null; 


document.addEventListener("DOMContentLoaded", async () => {
    const currentTab = window.location.hash;
    const imgSize = document.getElementById("imgSize");
    if(currentTab != "") {
        renderContent().then(() => {
            setActiveTab();
            if(tab == "history") {
                const historyData = loadHistoryFromStorage();
                const spinner = document.getElementById("spinner");
                const tableContainer = document.querySelector(".table-container"); 
                historyData.then((data) => {
                    spinner.setAttribute("aria-hidden", "true");
                    tableContainer.setAttribute("aria-hidden", "false");
                    renderHistoryTable(data);
                    historyList.push(...data);
                    document.getElementById("dlBtn").addEventListener("click", () => {
                        saveQRCode(textToGenerate);
                    })
                }).catch((resason) => {
                    spinner.setAttribute("aria-hidden", "true");
                    const alert = document.createElement("p");
                    alert.textContent = "empty history";
                    document.querySelector(".column3").appendChild(alert);
                    console.log(resason);
                })
            }
        })
    }

    window.addEventListener("hashchange", () => {
        renderContent().then(() => {
            setActiveTab();
            if(tab == "history") {
                const historyData = loadHistoryFromStorage();
                qrcode = null;
                historyData.then((data) => {
                    const spinner = document.getElementById("spinner");
                    const tableContainer = document.querySelector(".table-container"); 
                    spinner.setAttribute("aria-hidden", "true");
                    tableContainer.setAttribute("aria-hidden", "false");
                    renderHistoryTable(data);
                    historyList.push(...data);

                    document.getElementById("dlBtn").addEventListener("click", () => {
                        saveQRCode(textToGenerate);
                    })
                }).catch((resason) => {
                    spinner.setAttribute("aria-hidden", "true");
                    const alert = document.createElement("p");
                    alert.textContent = "empty history";
                    document.querySelector(".column3").appendChild(alert);
                    console.log(resason);
                })
            }
        })
    })
    
    generateBtn.addEventListener("click", () => {
        const text = textInput.value.trimStart();
        generated = true;
        generateQRCode(text, imgSize.value - 1);
    });

    if(tab == "home") {
        document.getElementById("dlBtn").addEventListener("click", () => {
            const fileName = imgName.value.trimStart();
            saveQRCode(fileName);
        })
        textInput.addEventListener("input", () => {
            if(generated) {
                generated = false;
            }
        })
    }
})


const saveQRCode = (fileName) => {
    const imageContainer = document.getElementById("imgShell");
    const img = imageContainer.querySelector("img");
    const link = document.createElement("a");
    link.href = img.src;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const storeToStorage = (text, size) => {
    const currentListStr = localStorage.getItem("generate_history");
    const timestamp = Date.now();
    const obj = {text: text, created_at: timestamp, size: size}

    if(currentListStr != null) {
        const currentList = JSON.parse(currentListStr);
        localStorage.setItem("generate_history", JSON.stringify([obj].concat(currentList)))
    } else {
        localStorage.setItem("generate_history", JSON.stringify([obj]))
    }
}


const loadHistoryFromStorage = () => {
    return new Promise((resolve, reject) => {
        const currentListStr = localStorage.getItem("generate_history");
        if (currentListStr != null) {
            try {
                const parsedList = JSON.parse(currentListStr);
                // setTimeout(
                //     () => {
                //         resolve(parsedList);
                //     },
                //     2000,
                //   );
                resolve(parsedList);
            } catch (error) {
                reject("Failed to parse history data");
            }
        } else {
            reject("Empty list");
        }
    });
}

const loadTab = async (file) => {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`Failed to load ${file}: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error(error);
        return `<p>Error loading content.</p>`;
    }
}

const renderContent = async () => {
    const contentContainer = document.getElementsByTagName("main").item(0);
    if(contentContainer == null) return
    const hash = window.location.hash;
    let isHome = false;

    let file;
    switch (hash) {
        case '#about':
            tab = "about"
            file = 'tab/about.html';
            break;
        case '#history':
            tab = "history"
            file = 'tab/history.html';
            break;
        default:
            isHome = true;
            return;
    }

    if(!isHome) {
        const html = await loadTab(file);
        contentContainer.innerHTML = html;
    }
}

const renderHistoryTable = (data) => {
    const tbody = document.getElementsByTagName("tbody").item(0);
    data.forEach((obj, i) => {
        const row = document.createElement("tr");
        row.setAttribute("aria-label", `row${i+1}`);
        const td4 = document.createElement("td");
        const columns = Object.values(obj);
        td4.innerHTML = `<p class="txt-btn" onclick="clickTableRow(${i+1})">show</p>`;
        for(let j = 0; j < columns.length; j++) {
            if(j == 2) continue;
            const val = columns[j];
            const td = document.createElement("td");
            td.className = "data-cell txt-column";
            if(j == 3) {
                td.setAttribute("aria-checked", "false");
            }
            if(j == 0) td.classList.add("data-cell--emphasized");
            if(j == 1) {
                td.textContent = timestampBeautify(val);
            } else {
                td.textContent = val;
            }
            row.appendChild(td);
        }
        row.appendChild(td4);
        tbody.appendChild(row);
    })
} 


const clickTableRow = (index) => {
    const currentChecked = document.querySelectorAll('td[aria-checked="true"]');
    if(currentChecked.length > 0) {
        const current = currentChecked.item(0);
        const parent = current.parentElement;
        const currentIndex = parent.getAttribute("aria-label").split("").pop();  
        current.setAttribute("aria-checked", "false");
        current.innerHTML = `<p class="txt-btn" onclick="clickTableRow(${currentIndex})">show</p>`;
    }
    const newCheckParent = document.querySelector(`tr[aria-label="row${index}"]`);
    const newCheck = newCheckParent.lastChild;
    newCheck.setAttribute("aria-checked", "true");
    newCheck.textContent = "now show";
    textToGenerate = historyList[index-1].text;
    generateQRCode(textToGenerate, historyList[index-1].size);
    const imgName = document.getElementById("imgName");
    imgName.value = textToGenerate.split(" ")[0];
}

const timestampBeautify = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const generateQRCode = (text, imgSize) => {
    const imgSizeOption = document.getElementById("imgSize");
    const imageContainer = document.getElementById("imgShell");
    const placeholder = document.getElementById("img-placeholder");
    const placeholderExist = placeholder.getAttribute("aria-hidden") == "false";
    if(placeholderExist) {
        placeholder.setAttribute("aria-hidden", "true");
    }
    if(!text) {
        alert('Input the text first!')
        textInput.focus()
        return
    }
    imgSizeOption.value = imgSize + 1;
    if(qrcode == null && placeholderExist) {
        qrcode = new QRCode(imageContainer, {
            text: text,
            width: imgSizeMap[imgSize],
            height: imgSizeMap[imgSize]
        });
    } else {
        let canvas = document.getElementsByTagName("canvas").item(0);
        qrcode.clear();
        qrcode._htOption.width = imgSizeMap[imgSize];
        qrcode._htOption.height = imgSizeMap[imgSize];
        canvas.width = imgSizeMap[imgSize];
        canvas.height = imgSizeMap[imgSize];
        qrcode.makeCode(text);
    }

    if(generated) {
        storeToStorage(text, imgSize);
    }

    generated = false;


    if(imgName == null || imgName.value == "") {
        imgName.value = Math.floor(Date.now() / 1000);
    }

}

const changeSize = (select) => {
    if(textToGenerate != null) {
        const sizeValue = select.value;
        const imgSize = imgSizeMap[sizeValue - 1];
        let canvas = document.getElementsByTagName("canvas").item(0);
        qrcode.clear();
        qrcode._htOption.width = imgSize;
        qrcode._htOption.height = imgSize;
        canvas.width = imgSize;
        canvas.height = imgSize;
        qrcode.makeCode(textToGenerate);
    }
}

const setActiveTab = () => {
    if(tab != "") {
        const tabs = Array.from(document.querySelectorAll('a[role="tab"]'));
        console.log(tabs);
        const currentActiveTab = document.querySelector('a[aria-checked="true"]');
        currentActiveTab.setAttribute("aria-checked", "false");
        const newActiveTab = tabs.filter((e) => e.getAttribute("aria-labelledby") == tab)[0];
        console.log(newActiveTab);
        if(newActiveTab != null) {
            newActiveTab.setAttribute("aria-checked", "true");
        }
    }

}