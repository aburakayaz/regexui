function getRegExpRangesWithNonCapturingGroups(input, regex) {
  let ranges = [];
  let match;
  let capturedGroups;
  let beginIndex, endIndex;
  while (match = regex.exec(input), match !== null) {
    beginIndex = match.index;
    endIndex = match.index + match[0].length;
    capturedGroups = '';
    for (let i = 1; i < match.length; i++) {
      capturedGroups += match[i];
    }
    if (capturedGroups !== '') {
      beginIndex = match.index + match[0].search(capturedGroups);
      endIndex = beginIndex + capturedGroups.length;
    }
    ranges.push([beginIndex, endIndex]);
    if (!regex.global) {
      // non-global regexes do not increase lastIndex, causing an infinite loop,
      // but we can just break manually after the first match
      break;
    }
  }
  return ranges;
}

function getRegExpRanges(input, regex) {
  if (/.*\(\?:.*\).*/.test(regex)) {
    return getRegExpRangesWithNonCapturingGroups(input, regex);
  }
  let ranges = [];
  let match;
  while (match = regex.exec(input), match !== null) {
    ranges.push([match.index, match.index + match[0].length]);
    if (!regex.global) {
      // non-global regexes do not increase lastIndex, causing an infinite loop,
      // but we can just break manually after the first match
      break;
    }
  }
  return ranges;
}

function getSearchRegexForSentences(input, rowNumber) {
  let searchType = $('#search-type-' + rowNumber).val();
  let searchText = $('#search-text-' + rowNumber).val();
  let query = "";

  if (searchText === '') {
    return [-1];
  }

  const start = '(?:^|\\.|\\?|\\!)(?: *)';
  const end = '(?: *)(?=$|\\.|\\?|\\!)';
  const otherWords = '([^\\.]*?)';

  searchText = '(' + searchText + ')';

  switch (searchType) {
    case 'CONTAIN':
    query = start + otherWords + searchText + otherWords + end;
    break;
    case 'START_WITH':
    query = start + searchText + otherWords + end;
    break;
    case 'END_WITH':
    query = start + otherWords + searchText + end;
    break;
  }

  return getRegExpRanges(input, new RegExp(query, 'g'));
}

function getSearchRegexForWords(input, rowNumber) {
  let searchType = $('#search-type-' + rowNumber).val();
  let searchText = $('#search-text-' + rowNumber).val();
  let query = "";

  if (searchText === '') {
    return [-1];
  }

  const start = '(?:^|\\.|\\?|\\!| )';
  const end = '(?=$|\\.|\\?|\\!| )';
  const otherChars = '([^\\. ]*?)';

  searchText = '(' + searchText + ')';

  switch (searchType) {
    case 'CONTAIN':
    query = start + otherChars + searchText + otherChars + end;
    break;
    case 'START_WITH':
    query = start + searchText + otherChars + end;
    break;
    case 'END_WITH':
    query = start + otherChars + searchText + end;
    break;
  }

  return getRegExpRanges(input, new RegExp(query, 'g'));
}

function getSearchRegex(input) {
  let searchMainType = $('#search-main-type').val();
  let func = getSearchRegexForWords;

  if (searchMainType === 'SENTENCES') {
    func = getSearchRegexForSentences;
  }

  let rowCount = $('#search-column').children().length;

  let ranges = func(input, 0);
  let nextRanges;

  for (let i = 1; i < rowCount; i++) {
    nextRanges = func(input, i);
    console.log(nextRanges);
    if (nextRanges.length === 1 && nextRanges[0] === -1) {
      continue;
    }
    ranges = ranges.filter(function(item) {
      for (let i = 0; i < nextRanges.length; i++) {
        if (nextRanges[i][0] == item[0] && nextRanges[i][1] == item[1]) {
          return true;
        }
      }
      return false;
    });
  }

  if (ranges.length === 1 && ranges[0] === -1) {
    return [];
  }
  
  return ranges;
}

function showRemoveButtons() {
  $('[id^=remove-button-]').show();
}

$('#expand-button').click(function() {
  let searchColumn = $('#search-column');
  let currentRowCount = searchColumn.children().length;

  let lastRow = searchColumn.children().first().html();
  lastRow = lastRow.replace(/0/g, currentRowCount);
  lastRow = lastRow.replace('that', 'and');
  let newRow = $('<div></div>');
  newRow.addClass('row pt-1 pb-1');
  newRow.attr('id', 'search-row-' + currentRowCount);
  newRow.html(lastRow);
  newRow.hide();

  searchColumn.append(newRow);
  newRow.show(100);

  showRemoveButtons();
});

$('#editor').highlightWithinTextarea({
  highlight: getSearchRegex
});

$('#collapse-button').click(function() {
  let status = $('#collapse-button').attr('status');

  if (status === 'visible') {
    $('#expand-button').hide(100);
    $('[id^=search-row-]').hide(100);
    $('#collapse-button').html('<img src="./images/unfold.svg" />');
    $('#collapse-button').attr('status', 'invisible');
    return;
  }

  $('#expand-button').show(100);
  $('[id^=search-row-]').show(100);
  $('#collapse-button').html('<img src="./images/fold.svg" />');
  $('#collapse-button').attr('status', 'visible');
});

$(document).on('click', '.remove-button', function(event) {
  let searchColumn = $('#search-column');
  let currentRowCount = searchColumn.children().length;
  let button = $(event.target);
  let removedId = button.attr('id').split('-')[2];

  for (let i = removedId; i < currentRowCount - 1; i++) {
    let child = $(searchColumn.children()[i]);
    let searchType = child.find('.search-type').first();
    let searchText = child.find('.search-text').first();

    let nextChild = $(searchColumn.children()[+i + +1]);
    let nextSearchType = nextChild.find('.search-type').first();
    let nextSearchText = nextChild.find('.search-text').first();

    searchType.val(nextSearchType.val());
    searchText.val(nextSearchText.val());
  }

  searchColumn.children()[currentRowCount - 1].remove();

  $('#editor').highlightWithinTextarea('update');

  if (currentRowCount - 1 == 1) {
    $('#remove-button-0').hide();
  }
});

$(document).on('keyup', '.search-text', function() {
  $('#editor').highlightWithinTextarea('update');
});

$(document).on('change', '.search-type', function() {
  $('#editor').highlightWithinTextarea('update');
});

$(document).on('change', '#search-main-type', function() {
  $('#editor').highlightWithinTextarea('update');
});

$('#remove-button-0').hide();
