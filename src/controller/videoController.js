import Video from '../models/Video';
import User from '../models/User';

export const home = async (req, res, next) => {
  const videos = await Video.find({});
  return res.render('home', { pageTitle: 'Home', videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate('owner');
  if (!video) {
    return res.render('404', { pageTitle: 'Video not found.' });
  }
  return res.render('watch', { pageTitle: video.title, video });
};

export const getUpload = (req, res, next) => {
  return res.render('upload', { pageTitle: 'Upload Video' });
};

export const postUpload = async (req, res, next) => {
  const {
    user: { _id },
  } = req.session;
  const { video } = req.files;
  const { title, description, hashtags } = req.body;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: video[0].path,
      hashtags: Video.formatHashtags(hashtags),
      owner: _id,
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect('/');
  } catch (error) {
    res.status(400).render('upload', {
      pageTitle: 'Upload Video',
      errorMessage: error._message,
    });
  }
};

export const getEdit = async (req, res, next) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.render('404', { pageTitle: 'Video not found.' });
  }
  if (String(video.owner) !== _id) {
    return res.status(403).redirect('/');
  }
  return res.render('edit', { pageTitle: `Edit ${video.title}`, video });
};

export const postEdit = async (req, res, next) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const { title, description, hashtags } = req.body;
  const video = await Video.exists({ _id: id });
  if (!video) {
    return res.status(404).render('404', { pageTitle: 'Video not found.' });
  }
  if (String(video.owner) !== _id) {
    return res.status(403).redirect('/');
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });

  return res.redirect(`/videos/${id}`);
};

export const deleteVideo = async (req, res, next) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render('404', { pageTitle: 'Video not found.' });
  }
  if (String(video.owner) !== _id) {
    return res.status(403).redirect('/');
  }
  await Video.findByIdAndDelete(id);
  return res.redirect('/');
};

export const search = async (req, res, next) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, 'i'),
      },
    });
  }
  return res.render('search', { pageTitle: `Searched by ${keyword}`, videos });
};
