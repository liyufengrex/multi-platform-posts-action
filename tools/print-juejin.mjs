import getPostList from '../src/util/get_list.ts'

const USER_ID = '3157453124930039'

const posts = await getPostList({
  user_id: USER_ID,
  plat_form: 'juejin',
})

console.log(JSON.stringify(posts, null, 2))
