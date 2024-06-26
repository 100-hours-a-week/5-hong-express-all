import { EMAIL_REGEX, NICKNAME_REGEX, PASSWORD_REGEX } from '../common/validate.js';
import { postFetch, uploadsImage } from '../common/utils.js';

const profileField = document.getElementById('profile');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');
const passwordConfirmField = document.getElementById('password-confirm');
const nicknameField = document.getElementById('nickname');
const profileHelper = document.getElementById('profile-helper');
const emailHelper = document.getElementById('email-helper');
const passwordHelper = document.getElementById('password-helper');
const passwordConfirmHelper = document.getElementById('password-confirm-helper');
const nicknameHelper = document.getElementById('nickname-helper');
const signupButton = document.getElementById('signup-button');

profileField.addEventListener('change', profileImageChangeEvent);
emailField.addEventListener('change', emailFieldInputEvent);
passwordField.addEventListener('input', passwordFieldInputEvent);
passwordConfirmField.addEventListener('input', passwordConfirmFieldEvent);
nicknameField.addEventListener('change', nicknameFieldInputEvent);
signupButton.addEventListener('click', signupButtonClickEvent);

window.addEventListener('load', (event) => {
  checkEnableButton();
});

let fieldValidContext = {
  profile: false,
  email: false,
  password: false,
  passwordConfirm: false,
  nickname: false,
};

// 이미지 url
let imageUrl;

// 프로필 이미지
async function profileImageChangeEvent() {
  const preview = document.getElementById('preview');
  const addSign = document.getElementById('image-add-sign');

  const file = profileField.files[0];
  if (!file) {
    console.log('파일이 없으');
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', async (event) => {
    try {
      imageUrl = await uploadsImage(file);
    } catch (error) {
      console.log(`이미지 업로드 실패, ${error}`);
      return;
    }

    // console.log(`profileImageUrl => ${reader.result}`);
    // preview.src = reader.result;
    preview.src = imageUrl;
    preview.style.display = 'block';
    addSign.style.display = 'none';
  }, false);

  reader.readAsDataURL(file);
  profileHelper.textContent = '';
  fieldValidContext.profile = true;

  checkEnableButton();
}

// 이메일
async function emailFieldInputEvent() {
  fieldValidContext.email = false;

  const value = emailField.value;
  let helperMessage = '';

  console.log(`now input(email) => ${value}`);

  if (value.trim().length === 0) {
    helperMessage = '*이메일을 입력해주세요.';
  } else if (!EMAIL_REGEX.test(value)) {
    helperMessage = '*올바른 이메일 주소 형식을 입력해주세요. (예:example@example.com)';
  } else if (await isDuplicateEmail(value)) {
    helperMessage = '*중복된 이메일 입니다.';
  } else {
    fieldValidContext.email = true;
  }
  emailHelper.textContent = helperMessage;

  checkEnableButton();
}

async function isDuplicateEmail(email) {
  console.log('fetch API :: request (nickname)');

  // const members = await fetchDummyMember();
  //
  // let findMember = members.find((member) =>
  //   member.email === email,
  // );
  // return findMember !== undefined;

  return postFetch('/api/v1/members/email', { email })
    .then(() => {
      return false;
    })
    .catch((e) => {  // TODO: 예외 처리 세분화
      console.log(e);
      return true;
    });
}

// 비밀번호
function passwordFieldInputEvent() {
  fieldValidContext.password = false;

  const value = passwordField.value;
  let helperMessage = '';

  console.log(`now input(password) => ${value}`);

  if (value.trim().length === 0) {
    helperMessage = '*비밀번호를 입력해주세요.';
  } else if (!PASSWORD_REGEX.test(value)) {
    helperMessage = '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야합니다.';
  } else {
    fieldValidContext.password = true;
  }
  passwordHelper.textContent = helperMessage;

  checkEnableButton();
  passwordConfirmFieldEvent();
}

// 비밀번호 확인
function passwordConfirmFieldEvent() {
  fieldValidContext.passwordConfirm = false;

  const value = passwordConfirmField.value;
  const password = passwordField.value;
  let helperMessage = '';

  console.log(`now input(passwordConfirm) => ${value}`);

  if (value.trim().length === 0) {
    helperMessage = '*비밀번호를 한번 더 입력해주세요.';
  } else if (value !== password) {
    helperMessage = '*비밀번호가 다릅니다.';
  } else {
    fieldValidContext.passwordConfirm = true;
  }
  passwordConfirmHelper.textContent = helperMessage;

  checkEnableButton();
}

// 닉네임
async function nicknameFieldInputEvent() {
  fieldValidContext.nickname = false;

  const value = nicknameField.value;
  let helperMessage = '';

  console.log(`now input(nickname) => ${value}`);

  if (value.trim().length === 0) {
    helperMessage = '*닉네임을 입력해주세요.';
  } else if (NICKNAME_REGEX.test(value)) {
    helperMessage = '*띄어쓰기를 없애주세요';
  } else if (value.length > 10) {
    helperMessage = '*닉네임은 최대 10자까지 작성 가능합니다.';
  } else if (await isDuplicateNickname(value)) {
    helperMessage = '*중복된 닉네임 입니다.';
  } else {
    fieldValidContext.nickname = true;
  }
  nicknameHelper.textContent = helperMessage;

  checkEnableButton();
}

async function isDuplicateNickname(nickname) {
  console.log('fetch API :: request (nickname)');
  // const members = await fetchDummyMember();
  //
  // let findMember = members.find((member) =>
  //   member.nickname === nickname,
  // );
  // return findMember !== undefined;

  return postFetch('/api/v1/members/nickname', { nickname })
    .then(() => {
      return false;
    })
    .catch((e) => {
      // TODO: 예외 처리 세분화
      console.log(e);
      return true;
    });
}

// 버튼을 누를 수 있나? (모든 유효성 검사 통과?)
function checkEnableButton() {
  const isAllValid = Object.values(fieldValidContext).every(valid => valid === true);
  if (isAllValid) {
    signupButton.disabled = false;
    signupButton.style.background = '#7F6AEE';
  } else {
    signupButton.disabled = true;
    signupButton.style.background = '#ACA0EB';
  }
}

async function signupButtonClickEvent(event) {
  event.preventDefault();

  // location.href = '/';

  const email = emailField.value;
  const password = passwordField.value;
  const nickname = nicknameField.value;

  const requestBody = {
    email,
    password,
    nickname,
    profileImage: imageUrl,
  };

  await postFetch('/api/v1/members/signup', requestBody)
    .then(() => {
      // 회원가입 성공
      location.href = '/';
    })
    .catch((e) => {  // TODO: 예외 처리 세분화
      console.log(`회원가입 중 오류 발생 = ${e}`);
    });
}
