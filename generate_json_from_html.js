// @ts-nocheck
var fs = require('fs');
var html2json = require('himalaya');
const { exit } = require('process');
const { assert } = require('console');

const inputPath = "D:/网站爬取/www.daorenjia.com"
const outputPath = "./json"


function getDmClass_L1(id) {
    switch (true) {
        case id <= 11:
            return "三洞真经";
            break;
        case id <= 20:
            return "四辅真经";
            break;
        case id <= 24:
            return "道教论集";
            break;
        case id <= 26:
            return "道法众术";
            break;
        case id <= 29:
            return "道教科仪";
            break;
        case id <= 31:
            return "道史仙传";
            break;
        default:
            throw "编号不存在！"
            break;
    };
};
function getDmClass_L2(id) {
    switch (id) {
        case 8:
            return "洞真上清经";
            break;
        case 9:
            return "洞玄灵宝经";
            break;
        case 10:
            return "洞神三皇经";
            break;
        case 11:
            return "三洞经教";
            break;
        case 12:
            return "太平部诸经";
            break;
        case 13:
            return "太玄部经诀";
            break;
        case 14:
            return "正一部经籙";
            break;
        case 15:
            return "道德真经";
            break;
        case 16:
            return "四子真经";
            break;
        case 17:
            return "黄帝阴符经";
            break;
        case 18:
            return "道教易学";
            break;
        case 19:
            return "太清金丹经";
            break;
        case 20:
            return "太清摄养经";
            break;
        case 21:
            return "诸子文集";
            break;
        case 22:
            return "道学论著";
            break;
        case 23:
            return "全真文集";
            break;
        case 24:
            return "道教类书";
            break;
        case 25:
            return "道法诸经";
            break;
        case 26:
            return "道法总集";
            break;
        case 27:
            return "科戒威仪";
            break;
        case 28:
            return "灵宝诸斋仪";
            break;
        case 29:
            return "灯仪法忏章表";
            break;
        case 30:
            return "神仙高道传";
            break;
        case 31:
            return "仙境名山志";
            break;
        default:
            throw "编号不存在！"
            break;

    };
};

const writeFileSyncRecursive = function (path, buffer) {
    let lastPath = path.substring(0, path.lastIndexOf("/"));
    fs.mkdirSync(lastPath, { recursive: true });
    fs.writeFileSync(path, buffer);
};

Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

var fileCnt = 0;

var description;
var paragraphs_raw;
var paragraphs;
var title;
var multiIndexNum = 0;
function commonReplace(str) {
    //sup,sub,ub,up替换
    let reg = new RegExp("<sup>|<sub>|<up>|<ub>");
    str = str.replace(reg, "(");
    reg = new RegExp("</sup>|</sub>|</up>|</ub>")
    str = str.replace(reg, ")");
    //去除空格
    str = str.replace(/\s/g, "");
    //一些其它修复
    str = str.replace("黃", "黄");
    return str;
}
function getContentRecursive(jsonIn) {
    let ret = "";
    //对于image标签，直接无视
    if (jsonIn.tagName == "img") {
        return "";
    };
    if (jsonIn.type == "text") {
        return jsonIn.content;
    };
    //不知道出现了什么问题的情况
    if (jsonIn.children.length == 0) {
        return ""
    };
    jsonIn.children.forEach(element => {
        ret += getContentRecursive(element);
    });
    return ret;
};

function parseSingle(jsonIn) {
    title = jsonIn[2].children[1].children[11].attributes[1].value;
    title = commonReplace(title);
    description = jsonIn[2].children[1].children[13].attributes[1].value;
    description = commonReplace(description);
    paragraphs_raw = jsonIn[2].children[3].children[1].children[7].children[3].children[1].children;
    paragraphs = new Array();
    paragraphs_raw.forEach(element => {
        if (element.tagName == "p") {
            let content = getContentRecursive(element);
            let reg = new RegExp("经名.{0,5}" + title); //删除正文中的简介，最大限度防止错误匹配
            if (!reg.exec(content)) {
                content = content.replace(/&nbsp;|&ldquo;|&rdquo;|\r\n|&middot;/ig, "");
                if (content != "" && content != title) paragraphs.push(content);
            };
        };
    });
};

function parseMultiIndexChar(str) {
    const reg = new RegExp("([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u96f6]{1,10})"); //匹配一~十和百，千，零
    let chnStr;
    if (!(chnStr = reg.exec(str)) || multiIndexNum > 0) { //无数字/已经获得了章节数(章节数总是写在最开头)
        return 1; //无需处理
    } else {
        chnStr = chnStr[1];
        //开始解析中文数字
        var chnNumChar = {
            零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9
        };
        var chnNameValue = {
            十: { value: 10, secUnit: false },
            百: { value: 100, secUnit: false },
            千: { value: 1000, secUnit: false },
            万: { value: 10000, secUnit: true },
            亿: { value: 100000000, secUnit: true }
        };

        var expNumChar = {
            十: 10, 十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15, 十六: 16, 十七: 17, 十八: 18, 十九: 19
        };
        if (expNumChar[chnStr]) {
            multiIndexNum = expNumChar[chnStr];
            return 0;
        }

        var rtn = 0;
        var section = 0;
        var number = 0;
        var secUnit = false;
        var str = chnStr.split('');
        for (var i = 0; i < str.length; i++) {
            var num = chnNumChar[str[i]];
            if (typeof num !== 'undefined') {
                number = num;
                if (i === str.length - 1) {
                    section += number;
                }
            } else {

                var cunit = chnNameValue[str[i]];

                if (typeof cunit == 'undefined') {
                    throw "未知错误";
                };

                var unit = chnNameValue[str[i]].value;
                secUnit = chnNameValue[str[i]].secUnit;
                if (secUnit) {
                    section = (section + number) * unit;
                    rtn += section;
                    section = 0;
                } else {
                    section += (number * unit);
                }
                number = 0;
            }
        }
        multiIndexNum = rtn + section;
        return 0;
    };
};
function parseMultiContent(jsonIn) {
    title = jsonIn[2].children[1].children[9].attributes[1].value;
    title = commonReplace(title);
    description = jsonIn[2].children[1].children[11].attributes[1].value;
    description = commonReplace(description);
    paragraphs_raw = jsonIn[2].children[3].children[5].children[3].children;
    paragraphs = new Array();
    paragraphs_raw.forEach(element => {
        if (element.tagName == "p") {
            let content = getContentRecursive(element);
            let reg = new RegExp("经名.{0,5}" + title); //删除正文中的简介，最大限度防止错误匹配
            let reg2 = new RegExp(title + ".{0,5}竟"); //删除正文最后的结束语 
            if (parseMultiIndexChar(content) && !reg.exec(content) && !reg2.exec(content)) {
                content = content.replace(/&nbsp;|&ldquo;|&rdquo;|\r\n|&middot;/ig, "");
                if (content != "" && content != title) paragraphs.push(content);
            };
        };
    });

};

//////////////////////////////
//正式开始处理
var fileList = fs.readdirSync(inputPath);

fileList = fileList.sort();
var fileList_copy = fileList.slice();
var multiContentList = new Array(); //分章节的经文的章节文件
var multiIndexList = new Array();   //分章节的经文的索引文件，暂时没什么价值


fileList_copy.forEach(fileName => {
    //fileName = "";
    if (fileName.indexOf("dao") < 0) {
        fileList.remove(fileName);

    } else {
        let reg = /daoz([0-9]*)-([0-9]*)-([0-9]*)/g;
        let tmp;
        if (tmp = reg.exec(fileName)) {
            multiContentList.push(fileName);
            fileList.remove(fileName);
            if (multiIndexList[multiIndexList.length - 1] != ("daozang" + tmp[1] + "-" + tmp[2])) {
                multiIndexList.push("daozang" + tmp[1] + "-" + tmp[2])
            };
        };
    };
});

multiIndexList.forEach(fileName => {
    fileList.remove(fileName);
});

//处理分章节的文件
multiContentList = multiContentList.sort();
var lastProceedIndexName = "";
var lastFilePath = "";
var jsonOut = {};
multiContentList.forEach(fileName => {
    let reg = /daoz([0-9]*)-([0-9]*)-([0-9]*)/g;
    let tmp = reg.exec(fileName);
    let indexName = "daozang" + tmp[1] + "-" + tmp[2];
    const htmlFile = fs.readFileSync(inputPath + "/" + fileName, { encoding: 'utf8' });
    const jsonIn = html2json.parse(htmlFile);

    //fs.writeFileSync("./out_json.3.json", JSON.stringify(jsonIn,null,2));
    if (lastProceedIndexName != "") {
        if (indexName == lastProceedIndexName) { //两个章节属于同一部经文
            parseMultiContent(jsonIn);
            let chapter = {};
            chapter.index = multiIndexNum;
            chapter.paragraphs = paragraphs;
            jsonOut.chapters.push(chapter);
            multiIndexNum = 0;
        } else { //处理新一部经文的第一章
            writeFileSyncRecursive(lastFilePath, JSON.stringify(jsonOut, null, 4));
            console.log(lastFilePath);
            jsonOut = {};
            lastProceedIndexName = indexName;
            parseMultiContent(jsonIn);
            let class1 = getDmClass_L1(Number(tmp[1]));
            let class2 = getDmClass_L2(Number(tmp[1]));
            lastFilePath = outputPath + "/" + class1 + "/" + class2 + "/" + title + "_multi.json";
            let chapter = {};
            chapter.index = multiIndexNum;
            chapter.paragraphs = paragraphs;
            jsonOut.title = title;
            jsonOut.description = description;
            jsonOut.chapters = new Array();
            jsonOut.chapters.push(chapter);
            multiIndexNum = 0;
        };
    } else {  //处理第一个
        lastProceedIndexName = indexName;
        parseMultiContent(jsonIn);
        let class1 = getDmClass_L1(Number(tmp[1]));
        let class2 = getDmClass_L2(Number(tmp[1]));
        lastFilePath = outputPath + "/" + class1 + "/" + class2 + "/" + title + "_multi.json";
        let chapter = {};
        chapter.index = multiIndexNum;
        chapter.paragraphs = paragraphs;
        jsonOut.title = title;
        jsonOut.description = description;
        jsonOut.chapters = new Array();
        jsonOut.chapters.push(chapter);
        multiIndexNum = 0;

    };
});
//处理最后一个
writeFileSyncRecursive(lastFilePath, JSON.stringify(jsonOut, null, 4));
jsonOut = {};
//exit();

//处理单个的文件
fileList.forEach(fileName => {
    //读取html文件
    //fileName = 'daozang31-43';
    var htmlFile = fs.readFileSync(inputPath + "/" + fileName, { encoding: 'utf8' });
    if (htmlFile.indexOf("PDF版") < 0) { //有些文档只提供pdf版，跳过它们!.
        const jsonIn = html2json.parse(htmlFile);
        //fs.writeFileSync("./out_json.2.json",JSON.stringify(jsonIn));
        parseSingle(jsonIn);
        //分类
        let reg = /daozang([0-9]*)-([0-9]*)/g;
        let tmp = reg.exec(fileName);
        let class1 = getDmClass_L1(Number(tmp[1]));
        let class2 = getDmClass_L2(Number(tmp[1]));
        var jsonOut = {};
        jsonOut.title = title;
        jsonOut.description = description;
        jsonOut.paragraphs = paragraphs;
        let outFileName = outputPath + "/" + class1 + "/" + class2 + "/" + title + ".json";
        writeFileSyncRecursive(outFileName, JSON.stringify(jsonOut, null, 4));
        console.log(outFileName);
    };
});