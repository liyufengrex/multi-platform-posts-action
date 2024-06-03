"use strict";
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
/* eslint-disable @typescript-eslint/no-unsafe-argument */
const superagent_1 = __importDefault(require("superagent"));
const cheerio_1 = require("cheerio");
function getJuejinList(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield superagent_1.default
            .post('https://api.juejin.cn/content_api/v1/article/query_list')
            .send({
            user_id,
            sort_type: 2,
            cursor: '0',
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const postArgs = res.body.data.map(({ article_info }) => {
            const { title, ctime, article_id, digg_count, collect_count } = article_info;
            return {
                title,
                publish_time: ctime,
                link: `https://juejin.cn/post/${article_id}`,
                star: Number(digg_count),
                collect: Number(collect_count),
            };
        });
        return postArgs;
    });
}
function getSegmentfaultList(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield superagent_1.default
            .get(`https://segmentfault.com/gateway/homepage/${user_id}/articles`)
            .send({
            size: 10,
            sort: 'newest',
        });
        const rows = res.body.rows;
        const postArgs = rows.map((row) => {
            const { title, url, created, votes } = row;
            return {
                title,
                publish_time: created,
                link: `https://segmentfault.com/${url}`,
                star: votes,
                collect: null,
            };
        });
        return postArgs;
    });
}
function getZhihuList(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield superagent_1.default
            .get(`https://www.zhihu.com/people/${user_id}/posts`);
        const $ = (0, cheerio_1.load)(res.text);
        const js = $('#js-initialData').text();
        const articles = Object.values(JSON.parse(js).initialState.entities.articles);
        articles.sort((a, b) => b.created - a.created);
        const postArgs = articles.map((article) => {
            const { title, url, created, voteupCount } = article;
            return {
                title,
                link: url,
                publish_time: created,
                star: voteupCount,
                collect: null,
            };
        });
        return postArgs;
    });
}
function getYuqueList(userName) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield superagent_1.default
            .get(`https://www.yuque.com/${userName}`);
        const argsStr = res.text.match(/window\.appData = JSON\.parse\(decodeURIComponent\("(.+?)"\)\)/)[1];
        const userId = JSON.parse(decodeURIComponent(argsStr)).user.id;
        const res2 = yield superagent_1.default.get(`https://www.yuque.com/api/events/public?id=${userId}&limit=10&offset=0`);
        const yuqueArticleInfos = res2.body.data;
        const postArgs = yuqueArticleInfos.map((yuqueArticleInfo) => {
            const { created_at, data } = yuqueArticleInfo;
            const { id, likes_count, title } = data;
            const timestamp = Date.parse(created_at);
            const seconds = Math.floor(timestamp / 1000);
            return {
                title,
                link: `https://www.yuque.com/go/doc/${id}`,
                publish_time: seconds,
                star: likes_count,
                collect: null,
            };
        });
        return postArgs;
    });
}
function getPostList({ user_id, plat_form }) {
    switch (plat_form) {
        case 'juejin':
            return getJuejinList(user_id);
        case 'segmentfault':
            return getSegmentfaultList(user_id);
        case 'zhihu':
            return getZhihuList(user_id);
        case 'yuque':
            return getYuqueList(user_id);
        default:
            break;
    }
}
exports.default = getPostList;
