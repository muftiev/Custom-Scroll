function inherit(proto) {
  function F() {}
  F.prototype = proto;
  return new F;
}

var WowScroll = {
	axis: 'y',
	wheel: 40,
	scroll: true,
	size: 'auto',
	sizethumb: 'auto',
	hide: true,
	buttons: true,
}