const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const jimp = require('jimp');

const mysql = require('mysql2/promise');


// MEMO: 設定項目はここを参考にした
// https://github.com/sidorares/node-mysql2#api-and-configuration
// https://github.com/mysqljs/mysql
const mysqlOption = {
  host: 'mysql',
  user: 'backend',
  password: 'backend',
  database: 'app',
  waitForConnections: true,
  connectionLimit: 100,
};
const pool = mysql.createPool(mysqlOption);

const mylog = (obj) => {
  if (Array.isArray(obj)) {
    for (const e of obj) {
      console.log(e);
    }
    return;
  }
  console.log(obj);
};

const getLinkedUser = async (headers) => {
  const target = headers['x-app-key'];
  mylog(target);
  const qs = `SELECT linked_user_id FROM session WHERE value = ?`;

  const [rows] = await pool.query(qs, [`${target}`]);

  if (rows.length !== 1) {
    mylog('セッションが見つかりませんでした。');
    return undefined;
  }

  return { user_id: rows[0].linked_user_id };
};

const filePath = 'file/';

// POST /records
// 申請情報登録
const postRecords = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  mylog(user);

  const body = req.body;
  mylog(body);

  let [rows] = await pool.query(
    `SELECT group_id FROM group_member WHERE user_id = ?
    AND is_primary = true`,
    [user.user_id],
  );

  if (rows.length !== 1) {
    mylog('申請者のプライマリ組織の解決に失敗しました。');
    res.status(400).send();
    return;
  }

  const userPrimary = rows[0];

  mylog(userPrimary);

  const newId = uuidv4();

  await pool.query(
    `insert into record
    (record_id, status, title, detail, category_id, application_group, created_by, created_at, updated_at)
    values (?, "open", ?, ?, ?, ?, ?, now(), now())`,
    [
      `${newId}`,
      `${body.title}`,
      `${body.detail}`,
      body.categoryId,
      userPrimary.group_id,
      user.user_id,
    ],
  );

  for (const e of body.fileIdList) {
    await pool.query(
      `insert into record_item_file
        (linked_record_id, linked_file_id, linked_thumbnail_file_id, created_at)
        values (?, ?, ?, now())`,
      [`${newId}`, `${e.fileId}`, `${e.thumbFileId}`],
    );
  }

  res.send({ recordId: newId });
};

// GET /records/{recordId}
// 文書詳細取得
const getRecord = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;

  const recordQs = `SELECT * FROM record WHERE record_id = ?`;

  const [recordResult] = await pool.query(recordQs, [`${recordId}`]);
  mylog(recordResult);

  if (recordResult.length !== 1) {
    res.status(404).send({});
    return;
  }

  let recordInfo = {
    recordId: '',
    status: '',
    title: '',
    detail: '',
    categoryId: null,
    categoryName: '',
    applicationGroup: '',
    applicationGroupName: null,
    createdBy: null,
    createdByName: null,
    createdByPrimaryGroupName: null,
    createdAt: null,
    files: [],
  };

  const searchPrimaryGroupQs = `SELECT group_id FROM group_member WHERE user_id = ? AND is_primary = true`;
  const searchUserQs = `SELECT name FROM user WHERE user_id = ?`;
  const searchGroupQs = `SELECT name FROM group_info WHERE group_id = ?`;
  const searchCategoryQs = `SELECT name FROM category WHERE category_id = ?`;

  const line = recordResult[0];

  const [primaryResult] = await pool.query(searchPrimaryGroupQs, [line.created_by]);
  if (primaryResult.length === 1) {
    const primaryGroupId = primaryResult[0].group_id;

    const [groupResult] = await pool.query(searchGroupQs, [primaryGroupId]);
    if (groupResult.length === 1) {
      recordInfo.createdByPrimaryGroupName = groupResult[0].name;
    }
  }

  const [appGroupResult] = await pool.query(searchGroupQs, [line.application_group]);
  if (appGroupResult.length === 1) {
    recordInfo.applicationGroupName = appGroupResult[0].name;
  }

  const [userResult] = await pool.query(searchUserQs, [line.created_by]);
  if (userResult.length === 1) {
    recordInfo.createdByName = userResult[0].name;
  }

  const [categoryResult] = await pool.query(searchCategoryQs, [line.category_id]);
  if (categoryResult.length === 1) {
    recordInfo.categoryName = categoryResult[0].name;
  }

  recordInfo.recordId = line.record_id;
  recordInfo.status = line.status;
  recordInfo.title = line.title;
  recordInfo.detail = line.detail;
  recordInfo.categoryId = line.category_id;
  recordInfo.applicationGroup = line.application_group;
  recordInfo.createdBy = line.created_by;
  recordInfo.createdAt = line.created_at;

  const searchItemQs = `SELECT linked_file_id,item_id FROM record_item_file WHERE linked_record_id = ? ORDER BY item_id asc`;
  const [itemResult] = await pool.query(searchItemQs, [line.record_id]);
  mylog('itemResult');
  mylog(itemResult);

  const searchFileQs = `SELECT name FROM file WHERE file_id = ?`;
  for (let i = 0; i < itemResult.length; i++) {
    const item = itemResult[i];
    const [fileResult] = await pool.query(searchFileQs, [item.linked_file_id]);

    let fileName = '';
    if (fileResult.length !== 0) {
      fileName = fileResult[0].name;
    }

    recordInfo.files.push({ itemId: item.item_id, name: fileName });
  }

  await pool.query(
    `
	INSERT INTO record_last_access
	(record_id, user_id, access_time)
	VALUES
	(?, ?, now())
	ON DUPLICATE KEY UPDATE access_time = now()`,
    [`${recordId}`, `${user.user_id}`],
  );

  res.send(recordInfo);
};


// PUT records/{recordId}
// 申請更新
const updateRecord = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;
  const status = req.body.status;

  await pool.query(`update record set status = ? WHERE record_id = ?`, [
    `${status}`,
    `${recordId}`,
  ]);

  res.send({});
};

// GET records/{recordId}/comments
// コメントの取得
const getComments = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;

  const combinedQs = `SELECT record_comment.comment_id as comment_id,
  record_comment.value as value,
  record_comment.created_at as created_at,
  record_comment.created_by as user_id,
  group_member.group_id as group_id,
  user.name as user_name,
  group_info.name as group_name
  FROM record_comment
  left join group_member ON record_comment.created_by =  group_member.user_id AND group_member.is_primary = true
  left join user ON group_member.user_id = user.user_id
  left join group_info ON group_member.group_id = group_info.group_id
  WHERE linked_record_id = ? ORDER BY created_at desc`;
  const [commentResult] = await pool.query(combinedQs, [`${recordId}`]);
  mylog(commentResult);

  const commentList = Array(commentResult.length);

  for (let i = 0; i < commentResult.length; i++) {
    let commentInfo = {
      commentId: '',
      value: '',
      createdBy: null,
      createdByName: null,
      createdByPrimaryGroupName: null,
      createdAt: null,
    };
    const line = commentResult[i];

    if (line.group_name !== null && line.group_name !== null) {
        commentInfo.createdByPrimaryGroupName = line.group_name;
    }
    if (line.user_name !== null) {
      commentInfo.createdByName = line.user_name;
    }
    commentInfo.commentId = line.comment_id;
    commentInfo.value = line.value;
    commentInfo.createdBy = line.user_id;
    commentInfo.createdAt = line.created_at;
    commentList[i] = commentInfo;
  }

  for (const row of commentList) {
    mylog(row);
  }

  res.send({ items: commentList });
};

// POST records/{recordId}/comments
// コメントの投稿
const postComments = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;
  const value = req.body.value;

  await pool.query(
    `
    insert into record_comment
    (linked_record_id, value, created_by, created_at)
    values (?,?,?, now());`,
    [`${recordId}`, `${value}`, user.user_id],
  );

  await pool.query(
    `
    UPDATE record SET updated_at = now() WHERE record_id = ?;`,
    [`${recordId}`],
  );

  res.send({});
};

// GET categories/
// カテゴリーの取得
const getCategories = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const [rows] = await pool.query(`SELECT * FROM category`);

  for (const row of rows) {
    mylog(row);
  }

  const items = {};

  for (let i = 0; i < rows.length; i++) {
    items[`${rows[i]['category_id']}`] = { name: rows[i].name };
  }

  res.send({ items });
};

// POST files/
// ファイルのアップロード
const postFiles = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const base64Data = req.body.data;
  mylog(base64Data);

  const name = req.body.name;

  const newId = uuidv4();
  const newThumbId = uuidv4();

  const binary = Buffer.from(base64Data, 'base64');

  fs.writeFileSync(`${filePath}${newId}_${name}`, binary);

  const image = await jimp.read(fs.readFileSync(`${filePath}${newId}_${name}`));
  mylog(image.bitmap.width);
  mylog(image.bitmap.height);

  const size = image.bitmap.width < image.bitmap.height ? image.bitmap.width : image.bitmap.height;
  await image.cover(size, size);

  await image.writeAsync(`${filePath}${newThumbId}_thumb_${name}`);

  await pool.query(
    `insert into file (file_id, path, name)
        values (?, ?, ?)`,
    [`${newId}`, `${filePath}${newId}_${name}`, `${name}`],
  );
  await pool.query(
    `insert into file (file_id, path, name)
        values (?, ?, ?)`,
    [`${newThumbId}`, `${filePath}${newThumbId}_thumb_${name}`, `thumb_${name}`],
  );

  res.send({ fileId: newId, thumbFileId: newThumbId });
};

// GET records/{recordId}/files/{itemId}
// 添付ファイルのダウンロード
const getRecordItemFile = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;
  mylog(recordId);
  const itemId = Number(req.params.itemId);
  mylog(itemId);

  const [rows] = await pool.query(
    `SELECT f.name, f.path FROM record_item_file r
    inner join file f
    ON
    r.linked_record_id = ?
    AND
    r.item_id = ?
    AND
    r.linked_file_id = f.file_id`,
    [`${recordId}`, `${itemId}`],
  );

  if (rows.length !== 1) {
    res.status(404).send({});
    return;
  }
  mylog(rows[0]);

  const fileInfo = rows[0];

  const data = fs.readFileSync(fileInfo.path);
  const base64 = data.toString('base64');
  mylog(base64);

  res.send({ data: base64, name: fileInfo.name });
};

// GET records/{recordId}/files/{itemId}/thumbnail
// 添付ファイルのサムネイルダウンロード
const getRecordItemFileThumbnail = async (req, res) => {
  let user = await getLinkedUser(req.headers);

  if (!user) {
    res.status(401).send();
    return;
  }

  const recordId = req.params.recordId;
  mylog(recordId);
  const itemId = Number(req.params.itemId);
  mylog(itemId);

  const [rows] = await pool.query(
    `SELECT f.name, f.path FROM record_item_file r
    inner join file f
    ON
    r.linked_record_id = ?
    AND
    r.item_id = ?
    AND
    r.linked_thumbnail_file_id = f.file_id`,
    [`${recordId}`, `${itemId}`],
  );

  if (rows.length !== 1) {
    res.status(404).send({});
    return;
  }
  mylog(rows[0]);

  const fileInfo = rows[0];

  const data = fs.readFileSync(fileInfo.path);
  const base64 = data.toString('base64');
  mylog(base64);

  res.send({ data: base64, name: fileInfo.name });
};

module.exports = {
  postRecords,
  getRecord,
  updateRecord,
  getComments,
  postComments,
  getCategories,
  postFiles,
  getRecordItemFile,
  getRecordItemFileThumbnail,
};
