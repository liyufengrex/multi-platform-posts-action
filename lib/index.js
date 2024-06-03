"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const core = __importStar(require("@actions/core"));
const get_list_1 = __importDefault(require("./util/get_list"));
const time_1 = require("./util/time");
const asset_1 = require("./util/asset");
const SUPPORT_PLAT_FORM = [
    /** 掘金 */
    'juejin',
    /** 思否 */
    'segmentfault',
    /** 知乎 */
    'zhihu',
    /** 暂时不支持语雀，最新更新文章获取有点麻烦 */
    // 'yuque',
];
const iconUrl = {
    juejin: 'juejin.svg',
    yuque: 'yuque.png',
    zhihu: 'zhihu.ico',
    segmentfault: 'segmentfault.ico',
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 读取参数: 用户 ID
        const USER_ID = core.getInput('user_id');
        // 读取参数: 平台 PLAT_FORM
        const PLAT_FORM = (core.getInput('platform'));
        if (!SUPPORT_PLAT_FORM.includes(PLAT_FORM))
            return core.setFailed(`平台: ${PLAT_FORM}暂不支持，请提issue`);
        try {
            core.info('1.获取页面数据...');
            const commonPosts = yield (0, get_list_1.default)({
                user_id: USER_ID,
                plat_form: PLAT_FORM,
            });
            core.info('2. 生成 html中...');
            const reduceText = commonPosts.reduce((total, item) => {
                const { title, publish_time, link, star, collect } = item;
                const time = (0, time_1.getTimeDiffString)(publish_time);
                return `${total}\n<li align='left'>[${time} 👍：${star}  ${collect === null ? '' : `⭐：${collect}`}]
      <a href="${link}" target="_blank">${title}</a>
      </li>`;
            }, '');
            const platformSvgUrl = (0, asset_1.getAssetUrl)(iconUrl[PLAT_FORM]);
            const appendHtml = `\n<ul>${reduceText}\n</ul>\n`;
            core.info(`3. 读取 README, 在 <!-- multi-platform-posts start --> 和 <!-- multi-platform-posts end --> 中间插入生成的 html: \n ${appendHtml}`);
            const README_PATH = './README.md';
            const res = node_fs_1.default.readFileSync(README_PATH, 'utf-8')
                .replace(/(?<=<!-- rex-platform-posts start -->)[.\s\S]*?(?=<!-- rex-platform-posts end -->)/, `${appendHtml}`);
            core.info('4. 修改 README ...');
            node_fs_1.default.writeFileSync(README_PATH, res);
            core.info(`5. 修改结果: ${res}`);
        }
        catch (error) {
            core.setFailed(error);
        }
    });
}
main();
