// TODO: 리팩토링......
import { deleteFetch, getFetch, postFetch, putFetch } from '../common/utils.js';

const postsOwnerDetailContainer = document.querySelector('.posts-detail');
const postsBodyContainer = document.querySelector('.posts-body');
const commentsListContainer = document.querySelector('.comments-list-container');
const commentsContent = document.getElementById('comments');
const commentsButton = document.getElementById('comments-button');

// 댓글 목록 무한 스크롤
let nowRequestPage = 1;

let isAlreadyFetch = false;
let isEndPage = false;

// Vanilla JS 에서 상태 저장은 어떻게?
let nowSelectCommentsId;

// 현재 사용자 아이디
let nowMemberId;

// window.addEventListener('load', insertHTML);
window.addEventListener('load', async () => {
  await getFetch('/api/v1/members')
    .then((jsonData) => {
      nowMemberId = jsonData.memberId;
      console.log(`현재 접속중인 사용자 id => ${nowMemberId}`);
    })
    .catch((e) => console.log(e));

  await insertHTML();
});
window.addEventListener('scroll', infiniteScrollEvent);
commentsContent.addEventListener('input', checkEnableButton);
commentsButton.addEventListener('click', commentsButtonClickEvent);

function getPostId() {
  const pathname = window.location.pathname;
  const StringTypePostId = pathname.split('/')[2];
  return parseInt(StringTypePostId, 10);
}

async function insertHTML() {
  const nowPostsId = getPostId();

  const findPosts = await getFetch(`/api/v1/posts/${nowPostsId}`)
    .catch((e) => {
      console.log(e);
    });
  postsOwnerDetailContainer.innerHTML = generatedPostsOwnerDetail(findPosts);
  postsBodyContainer.innerHTML = generatedPostsBody(findPosts);

  setPostsEvent();

  await insertCommentsList();
}

function infiniteScrollEvent() {
  console.log('스크롤 이벤트 발생');

  if (isAlreadyFetch) {
    console.log('이미 fetch request 전송함');
    return;
  }

  if (isEndPage) {
    console.log('더이상 받을 데이터 없음. => 무한 스크롤 이벤트 제거');
    window.removeEventListener('scroll', infiniteScrollEvent);
    return;
  }

  const scrollTop = document.documentElement.scrollTop;
  const innerHeight = window.innerHeight;
  const scrollHeight = document.body.scrollHeight;

  if (scrollTop + innerHeight >= scrollHeight) {
    showLoadingAnimation();

    isAlreadyFetch = true;
    setTimeout(() => {
      insertCommentsList()
        .then(() => {
          dropLoadingAnimation();
        });
    }, 500);
  }
}

function showLoadingAnimation() {
  console.log('로딩중 표시');
  const target = document.querySelector('.loading-wrap');
  target.style.display = 'flex';
}

function dropLoadingAnimation() {
  console.log('로딩중 삭제');
  const target = document.querySelector('.loading-wrap');
  target.style.display = 'none';
}

async function insertCommentsList() {
  const nowPostsId = getPostId();
  const requestUrl = `/api/v1/comments?page=${nowRequestPage}&postsId=${nowPostsId}`;

  const findComments = await getFetch(requestUrl)
    .then((jsonData) => {
      if (!jsonData.hasNext) {
        isEndPage = true;
      }
      nowRequestPage = jsonData.nextPage;
      return jsonData.data;
    }).catch((e) => {
      console.log(e);
      isEndPage = true;
    });

  if (findComments) {  // 해당 게시글에 등록된 댓글이 있는 경우
    insertCommentList(findComments);
  }

  setCommentsEvent();
  isAlreadyFetch = false;  // fetch 요청 완료
}

function generatedPostsOwnerDetail(posts) {
  const postsId = posts.postsId;
  const title = posts.title;
  const ownerProfileImage = posts.owner.profileImage;
  const ownerNickname = posts.owner.nickname;
  const postsDate = posts.createdAt;

  let additionalContent = '';

  console.log(`게시글 아이디 => ${posts.owner.memberId}`);
  const commentsOwnerId = posts.owner.memberId;
  if (commentsOwnerId === nowMemberId) {
    additionalContent = `
      <button class="edit-button" id="posts-edit-button" data-posts-id="${postsId}">수정</button>
      <button class="delete-button" id="posts-delete-button" data-posts-id="${postsId}">삭제</button>
    `;
  }

  return `
    <div class="posts-detail-title"><h1>${title}</h1></div>
    <div class="posts-owner-detail-container">
      <div class="posts-info">
        <div class="posts-owner-info">
          <img src="${ownerProfileImage}" class="circle-image">
          <p><span class="highlight">${ownerNickname}</span></p>
        </div>
        <div class="posts-date-time"><p>${postsDate}</p></div>
      </div>
      <div class="edit-button-container">
        ${additionalContent}
      </div>
    </div>
  `;
}

function generatedPostsBody(posts) {
  const thumbnail = posts.thumbnail;
  const contents = posts.contents;
  const hitsCount = numberFormater(posts.hitsCount);
  const commentsCount = numberFormater(posts.commentsCount);

  return `
    <div class="posts-thumbnail">
      <div class="rectangle">
        <img src="${thumbnail}" alt="posts thumbnail">
      </div>
    </div>
    <div class="posts-content">${contents}</div>
    <div class="metadata-box-container">
      <div class="metadata-box">
        <span class="metadata-value">${hitsCount}</span>
        <span class="metadata-label">조회수</span>
      </div>
      <div class="metadata-box">
        <span class="metadata-value" id="comments-count">${commentsCount}</span>
        <span class="metadata-label">댓글</span>
      </div>
    </div>
  `;
}

function insertCommentList(comments) {
  comments.forEach(comment => {
    const element = document.createElement('div');
    element.classList.add('comments-info');

    element.innerHTML = generatedComment(comment);
    commentsListContainer.append(element);
  });
}

function generatedComment(comment) {
  const commentId = comment.commentsId;
  const contents = comment.contents;
  const commentsDate = comment.createdAt;
  const ownerNickname = comment.owner.nickname;
  const ownerProfile = comment.owner.profileImage;

  let additionalContent = '';

  const commentsOwnerId = comment.owner.memberId;
  if (commentsOwnerId === nowMemberId) {
    additionalContent = `
      <button class="edit-button comments" data-comment-id="${commentId}">수정</button>
      <button class="delete-button comments" data-comment-id="${commentId}">삭제</button>
    `;
  }

  return `
    <div class="comments-owner-info">
      <img src="${ownerProfile}" class="circle-image">
      <p><span class="highlight">${ownerNickname}</span></p>
      <p><span class="date-time">${commentsDate}</span></p>
      <div class="comments-button-container">
        ${additionalContent}
      </div>
    </div>
    <div class="comments-contents">${contents}</div>
  `;
}

// 댓글 작성
function checkEnableButton() {
  const contents = commentsContent.value;

  // 공백만 있거나 작성을 안한 경우
  if (contents.trim().length === 0) {
    commentsButton.disabled = true;
    commentsButton.style.backgroundColor = '#ACA0EB';
    return false;
  }
  commentsButton.disabled = false;
  commentsButton.style.backgroundColor = '#7F6AEE';
  return true;
}

// TODO: 댓글 수정 과 생성은 어떻게 구분할지 생각
// 댓글 등록 or 수정 버튼
async function commentsButtonClickEvent(event) {
  event.preventDefault();

  if (!checkEnableButton()) {
    console.log('댓글 미작성');
    return;
  }

  // TODO: 리팩토링 (로직 분리)
  const contents = commentsContent.value;

  if (commentsButton.textContent === '댓글 수정') {  // 이렇게 텍스트로 하는게 맞나..?
    // 댓글 수정
    console.log('댓글 수정하기 버튼 누름');

    await putFetch(`/api/v1/comments/${nowSelectCommentsId}`, { contents })
      .then(() => {
        updateComment(contents);
      }).catch((e) => {
        console.log(e);
      });
  } else {
    // 댓글 생성
    console.log('새로운 댓글 생성하기 버튼 누름');
    const postsId = getPostId();

    await postFetch('/api/v1/comments', { contents, postsId })
      .then((jsonData) => {
        createNewComments(jsonData);  // 댓글 목록의 최상단에 새 댓글을 밀어 넣음
      }).catch((e) => {
        console.log(e);
      });
  }

  // 완료 후 작성한 댓글(현재 입력한 text) 삭제 & "댓글 등록" 으로 변경 (수정할 경우 때문에 : 리팩토링)
  const commentsInputBox = document.querySelector('.comments-input-box');
  commentsInputBox.value = '';
  commentsButton.textContent = '댓글 등록';
  commentsButton.disabled = true;
  commentsButton.style.backgroundColor = '#ACA0EB';
}

// 댓글 목록에서 변경될 경우 (수정 버튼을 통해 변경될 경우)
function updateComment(contents) {
  // 현재 보여지는 댓글 목록에서 수정
  const element = document.querySelector(`[data-comment-id="${nowSelectCommentsId}"]`);
  const parentElement = element.parentNode.parentNode.parentNode;
  const beforeContents = parentElement.querySelector('.comments-contents');
  beforeContents.textContent = contents;
}

// 댓글 목록의 최상단에 새 댓글을 밀어 넣음
function createNewComments(data) {
  const element = document.createElement('div');
  element.classList.add('comments-info');

  element.innerHTML = generatedComment(data);
  commentsListContainer.prepend(element);

  // 게시글의 댓글 수 + 1
  const commentsCount = document.getElementById('comments-count');
  const nowPostsHasCommentsNum = parseInt(commentsCount.textContent);
  commentsCount.textContent = String(nowPostsHasCommentsNum + 1);

  // TODO: 이벤트 등록 리팩토링
  // 수정 이벤트 등록
  const editButton = document.getElementsByClassName('edit-button comments')[0];
  editButton.addEventListener('click', (event) => {
    editComment(event.target);
  });

  // 삭제 이벤트 등록
  const deleteButton = document.getElementsByClassName('delete-button comments')[0];
  deleteButton.addEventListener('click', (event) => {
    showCommentsModal(event.target);
  });
}

// 댓글 수정 버튼 눌렀을 때
function editComment(element) {
  // 수정하기 버튼 선택시 댓글 id 정보를 저장
  nowSelectCommentsId = element.getAttribute('data-comment-id');
  console.log(`현재 선택한 댓글 id => ${nowSelectCommentsId}`);

  const parentElement = element.parentNode.parentNode.parentNode;
  const contentElement = parentElement.querySelector('.comments-contents');
  const content = contentElement.textContent;

  const commentsInputBox = document.querySelector('.comments-input-box');
  commentsInputBox.value = content;

  commentsButton.textContent = '댓글 수정';
}

// 게시글 이벤트 등록
function setPostsEvent() {
  const editButton = document.getElementById('posts-edit-button');
  const deleteButton = document.getElementById('posts-delete-button');

  if (editButton) {
    editButton.addEventListener('click', (event) => {
      const element = event.target;
      const postsId = element.getAttribute('data-posts-id');
      location.href = `/posts/${postsId}/edit`;
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      showPostsModal();
    });
  }
}

// 댓글 이벤트 등록
function setCommentsEvent() {
  const editButtons = document.getElementsByClassName('edit-button comments');
  const deleteButtons = document.getElementsByClassName('delete-button comments');

  // 댓글 수정 이벤트
  for (const editButton of editButtons) {
    editButton.addEventListener('click', (event) => {
      editComment(event.target);
    });
  }

  // 댓글 삭제 이벤트
  for (const deleteButton of deleteButtons) {
    deleteButton.addEventListener('click', (event) => {
      showCommentsModal(event.target);
    });
  }
}

function showPostsModal() {
  const modal = document.getElementById('posts-modal');
  modal.style.display = 'block';

  // 게시글 모달 이벤트 등록
  const okButton = modal.querySelector('.ok');
  okButton.addEventListener('click', deletePostsEvent);

  const closeButton = modal.querySelector('.close');
  closeButton.addEventListener('click', closeModalEvent);
}

function showCommentsModal(element) {
  // 현재 선택한 id 값 state 에 저장
  nowSelectCommentsId = element.getAttribute('data-comment-id');
  console.log(`현재 선택한 댓글 id => ${nowSelectCommentsId}`);

  const modal = document.getElementById('comments-modal');
  modal.style.display = 'block';

  // 댓글 모달 이벤트 등록
  const okButton = modal.querySelector('.ok');
  okButton.addEventListener('click', deleteCommentsEvent);

  const closeButton = modal.querySelector('.close');
  closeButton.addEventListener('click', closeModalEvent);
}

// 게시글 모달 삭제 이벤트
async function deletePostsEvent(event) {
  const element = event.target;
  const modal = element.parentNode.parentNode.parentNode;
  modal.style.display = 'none';

  const postsId = getPostId();
  await deleteFetch(`/api/v1/posts/${postsId}`)
    .then(() => {
      location.href = '/main';  // 메인으로 이동
    }).catch((e) => {
      console.log(e);
    });

  modal.removeEventListener('click', deletePostsEvent);
}

// 댓글 모달 삭제 이벤트
async function deleteCommentsEvent(event) {
  const element = event.target;
  const modal = element.parentNode.parentNode.parentNode;
  modal.style.display = 'none';

  await deleteFetch(`/api/v1/comments/${nowSelectCommentsId}`)
    .catch((e) => {
      console.log(e);
    });

  // 게시글의 댓글 수 - 1
  const commentsCount = document.getElementById('comments-count');
  const nowPostsHasCommentsNum = parseInt(commentsCount.textContent);
  commentsCount.textContent = String(nowPostsHasCommentsNum - 1);

  // 현재 보여지는 댓글 요소를 삭제
  const commentsElement = document.querySelector(`[data-comment-id="${nowSelectCommentsId}"]`);
  const parentElement = commentsElement.parentNode.parentNode.parentNode;
  parentElement.remove();

  modal.removeEventListener('click', deleteCommentsEvent);
}

// 모달 닫기 이벤트
function closeModalEvent(event) {
  const element = event.target;
  const modal = element.parentNode.parentNode.parentNode;
  modal.style.display = 'none';

  modal.removeEventListener('click', closeModalEvent);
}

// TODO: 중복될 코드 같다.
function numberFormater(num) {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1) + 'm';

  if (num >= 1_000)
    return (num / 1_000).toFixed(0) + 'k';

  return num.toString();
}
