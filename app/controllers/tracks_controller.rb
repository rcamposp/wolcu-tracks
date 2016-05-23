class TracksController < ApplicationController  
  
  def index
    @tracks = Track.all
  end

  def new
    @track = Track.new
    @marker = Marker.new
  end

  def create    
    if params[:track][:gpx] != nil        
      uploaded_io = params[:track][:gpx]
      unique_gpx = Time.now.to_i.to_s + "_" + uploaded_io.original_filename
      File.open(Rails.root.join('public', 'uploads', unique_gpx), 'wb') do |file|
        file.write(uploaded_io.read)
      end      
    end

    @track = Track.new(gpx: unique_gpx, name: params[:track][:name], description: params[:track][:description])

    if @track.save
      redirect_to @track, notice: "Track was created"
    else  
      render :new
    end
    
  end

  def show
  end

  def edit
  end

  def update
  end

  def destroy
  end
end
