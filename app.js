const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const views = require('koa-views');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = new Koa();
const router = new Router();

// User data storage (in-memory for this example)
const users = [];

// JWT secret
const SECRET = 'dreanworld';

// Middleware setup
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));
app.use(views(path.join(__dirname, 'pages'), { extension: 'ejs' }));

// Authentication middleware
const auth = (ctx, next) => {
  return jwt.verify(ctx.cookies.get('token'), SECRET, (err, decoded) => {
    if (err) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
    } else {
      ctx.state.user = decoded;
      return next();
    }
  });
};

// Routes
router.get('/', async (ctx) => {
  await ctx.render('index');
});

router.get('/project1', async (ctx) => {
  await ctx.render('project1');
});

router.get('/project2', async (ctx) => {
  await ctx.render('project2');
});

router.get('/login', async (ctx) => {
  await ctx.render('login');
});

router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '1h' });
    ctx.cookies.set('token', token, { httpOnly: true });
    ctx.redirect('/');
  } else {
    ctx.body = 'Invalid username or password';
  }
});

router.get('/register', async (ctx) => {
  await ctx.render('register');
});

router.post('/register', async (ctx) => {
  const { username, password } = ctx.request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  ctx.redirect('/login');
});

router.get('/protected', auth, async (ctx) => {
  ctx.body = `Hello ${ctx.state.user.username}`;
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
